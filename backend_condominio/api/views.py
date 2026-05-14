from django.db.models import Sum, Count
from django.utils import timezone
from django.db import models
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny

from django_filters.rest_framework import DjangoFilterBackend

from .models import (
    Usuario,
    Condominio,
    Unidade,
    Cobranca,
    Acordo,
    ParcelaAcordo
)

from .serializers import (
    UsuarioSerializer,
    RegisterSerializer,
    CondominioSerializer,
    UnidadeSerializer,
    CobrancaSerializer,
    AcordoSerializer,
    ParcelaAcordoSerializer
)

from .permissions import IsAdminOrReadOnly


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)

        if serializer.is_valid():
            usuario = serializer.save()
            return Response(
                UsuarioSerializer(usuario).data,
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UsuarioMeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UsuarioSerializer(request.user)
        return Response(serializer.data)


class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all().order_by('id')
    serializer_class = UsuarioSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]


class CondominioViewSet(viewsets.ModelViewSet):
    queryset = Condominio.objects.all().order_by('id')
    serializer_class = CondominioSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['nome', 'cnpj']


class UnidadeViewSet(viewsets.ModelViewSet):
    queryset = Unidade.objects.select_related('condominio').all().order_by('id')
    serializer_class = UnidadeSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['condominio', 'status', 'numero']

    @action(detail=True, methods=['get'], url_path='resumo-financeiro')
    def resumo_financeiro(self, request, pk=None):
        unidade = self.get_object()

        cobrancas = unidade.cobrancas.all()
        acordos = unidade.acordos.all()

        total_cobrancas = cobrancas.count()
        total_pagas = cobrancas.filter(status='PAGO').count()
        total_vencidas = cobrancas.filter(status='VENCIDO').count()
        total_pendentes = cobrancas.filter(status='PENDENTE').count()

        valor_em_aberto = cobrancas.filter(
            status__in=['PENDENTE', 'VENCIDO']
        ).aggregate(
            total=Sum('valor')
        )['total'] or 0

        return Response({
            'unidade': unidade.id,
            'responsavel': unidade.responsavel,
            'total_cobrancas': total_cobrancas,
            'total_pagas': total_pagas,
            'total_vencidas': total_vencidas,
            'total_pendentes': total_pendentes,
            'valor_em_aberto': valor_em_aberto,
            'possui_acordo': acordos.exists()
        })


class CobrancaViewSet(viewsets.ModelViewSet):
    queryset = Cobranca.objects.select_related(
        'unidade',
        'unidade__condominio'
    ).all().order_by('-data_vencimento')

    serializer_class = CobrancaSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend]

    filterset_fields = [
        'unidade',
        'status',
        'competencia',
        'data_vencimento'
    ]

    def get_queryset(self):
        queryset = super().get_queryset()

        condominio = self.request.query_params.get('condominio')
        unidade = self.request.query_params.get('unidade')
        status_param = self.request.query_params.get('status')
        competencia = self.request.query_params.get('competencia')
        data_inicio = self.request.query_params.get('data_inicio')
        data_fim = self.request.query_params.get('data_fim')

        if condominio:
            queryset = queryset.filter(unidade__condominio_id=condominio)

        if unidade:
            queryset = queryset.filter(unidade_id=unidade)

        if status_param:
            queryset = queryset.filter(status=status_param)

        if competencia:
            queryset = queryset.filter(competencia=competencia)

        if data_inicio:
            queryset = queryset.filter(data_vencimento__gte=data_inicio)

        if data_fim:
            queryset = queryset.filter(data_vencimento__lte=data_fim)

        return queryset

    @action(detail=False, methods=['get'], url_path='inadimplentes')
    def inadimplentes(self, request):
        hoje = timezone.now().date()

        cobrancas = self.get_queryset().filter(
            data_vencimento__lt=hoje
        ).exclude(
            status='PAGO'
        )

        serializer = self.get_serializer(cobrancas, many=True)
        return Response(serializer.data)

    def perform_update(self, serializer):
        cobranca = serializer.save()

        if hasattr(cobranca, 'parcela_acordo'):
            parcela = cobranca.parcela_acordo
            parcela.status = cobranca.status
            parcela.save()

class AcordoViewSet(viewsets.ModelViewSet):
    queryset = Acordo.objects.prefetch_related(
        'cobrancas',
        'parcelas'
    ).select_related('unidade').all().order_by('-data_criacao')

    serializer_class = AcordoSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['unidade', 'data_criacao']


class ParcelaAcordoViewSet(viewsets.ModelViewSet):
    queryset = ParcelaAcordo.objects.select_related('acordo').all().order_by('id')
    serializer_class = ParcelaAcordoSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['acordo', 'status', 'data_vencimento']


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        total_condominios = Condominio.objects.count()
        total_unidades = Unidade.objects.count()
        total_cobrancas = Cobranca.objects.count()
        total_pagas = Cobranca.objects.filter(status='PAGO').count()
        total_pendentes = Cobranca.objects.filter(status='PENDENTE').count()
        total_vencidas = Cobranca.objects.filter(status='VENCIDO').count()

        valor_total_recebido = Cobranca.objects.filter(
            status='PAGO'
        ).aggregate(
            total=Sum('valor')
        )['total'] or 0

        valor_total_em_aberto = Cobranca.objects.filter(
            status__in=['PENDENTE', 'VENCIDO']
        ).aggregate(
            total=Sum('valor')
        )['total'] or 0

        total_acordos = Acordo.objects.count()

        return Response({
            'total_condominios': total_condominios,
            'total_unidades': total_unidades,
            'total_cobrancas': total_cobrancas,
            'total_pagas': total_pagas,
            'total_pendentes': total_pendentes,
            'total_vencidas': total_vencidas,
            'valor_total_recebido': valor_total_recebido,
            'valor_total_em_aberto': valor_total_em_aberto,
            'total_acordos': total_acordos
        })

class InadimplenciaResumoView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        hoje = timezone.now().date()

        condominios = Condominio.objects.all()
        dados = []

        for condominio in condominios:
            cobrancas_vencidas = Cobranca.objects.filter(
                unidade__condominio=condominio,
                data_vencimento__lt=hoje
            ).exclude(status='PAGO')

            qtd = cobrancas_vencidas.count()

            valor_total = cobrancas_vencidas.aggregate(
                total=Sum('valor')
            )['total'] or 0

            if qtd > 0:
                dados.append({
                    'condominio': condominio.nome,
                    'qtd_cobrancas_vencidas': qtd,
                    'valor_total_vencido': valor_total
                })

        return Response(dados)