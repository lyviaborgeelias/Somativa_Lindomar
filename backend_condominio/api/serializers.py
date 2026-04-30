from rest_framework import serializers
from datetime import timedelta
from decimal import Decimal

from .models import (
    Usuario,
    Condominio,
    Unidade,
    Cobranca,
    Acordo,
    ParcelaAcordo
)


class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = [
            'id',
            'username',
            'email',
            'nome',
            'telefone',
            'tipo',
            'is_staff',
            'is_superuser',
        ]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = Usuario
        fields = [
            'id',
            'username',
            'email',
            'password',
            'nome',
            'telefone',
            'tipo',
        ]

    def create(self, validated_data):
        password = validated_data.pop('password')

        user = Usuario(**validated_data)
        user.set_password(password)

        if user.tipo == 'ADMIN':
            user.is_staff = True
            user.is_superuser = True

        user.save()
        return user


class CondominioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Condominio
        fields = [
            'id',
            'nome',
            'cnpj',
            'endereco',
        ]


class UnidadeSerializer(serializers.ModelSerializer):
    condominio_id = serializers.PrimaryKeyRelatedField(
        source='condominio',
        queryset=Condominio.objects.all(),
        write_only=True
    )

    condominio = CondominioSerializer(read_only=True)

    class Meta:
        model = Unidade
        fields = [
            'id',
            'numero',
            'bloco',
            'responsavel',
            'status',
            'condominio',
            'condominio_id',
        ]


class CobrancaSerializer(serializers.ModelSerializer):
    unidade_id = serializers.PrimaryKeyRelatedField(
        source='unidade',
        queryset=Unidade.objects.all(),
        write_only=True
    )

    unidade = UnidadeSerializer(read_only=True)

    class Meta:
        model = Cobranca
        fields = [
            'id',
            'unidade',
            'unidade_id',
            'competencia',
            'data_vencimento',
            'valor',
            'status',
            'data_pagamento',
            'forma_pagamento',
            'multa',
            'juros',
        ]
        read_only_fields = ['multa', 'juros']

    def validate(self, data):
        status = data.get('status')
        data_pagamento = data.get('data_pagamento')

        if status == 'PAGO' and not data_pagamento:
            raise serializers.ValidationError({
                'data_pagamento': 'A data de pagamento é obrigatória quando o status for PAGO.'
            })

        return data


class ParcelaAcordoSerializer(serializers.ModelSerializer):
    acordo_id = serializers.PrimaryKeyRelatedField(
        source='acordo',
        queryset=Acordo.objects.all(),
        write_only=True
    )

    class Meta:
        model = ParcelaAcordo
        fields = [
            'id',
            'acordo',
            'acordo_id',
            'numero_parcela',
            'data_vencimento',
            'valor',
            'status',
        ]
        read_only_fields = ['acordo']


class AcordoSerializer(serializers.ModelSerializer):
    unidade_id = serializers.PrimaryKeyRelatedField(
        source='unidade',
        queryset=Unidade.objects.all(),
        write_only=True
    )

    cobrancas_ids = serializers.PrimaryKeyRelatedField(
        source='cobrancas',
        queryset=Cobranca.objects.all(),
        many=True,
        write_only=True
    )

    unidade = UnidadeSerializer(read_only=True)
    cobrancas = CobrancaSerializer(many=True, read_only=True)
    parcelas = ParcelaAcordoSerializer(many=True, read_only=True)

    class Meta:
        model = Acordo
        fields = [
            'id',
            'unidade',
            'unidade_id',
            'cobrancas',
            'cobrancas_ids',
            'quantidade_parcelas',
            'data_criacao',
            'valor_total',
            'parcelas',
        ]
        read_only_fields = ['data_criacao', 'valor_total', 'parcelas']

    def validate(self, data):
        unidade = data.get('unidade')
        cobrancas = data.get('cobrancas')
        quantidade_parcelas = data.get('quantidade_parcelas')

        if quantidade_parcelas <= 0:
            raise serializers.ValidationError({
                'quantidade_parcelas': 'A quantidade de parcelas deve ser maior que zero.'
            })

        for cobranca in cobrancas:
            if cobranca.unidade != unidade:
                raise serializers.ValidationError(
                    'Todas as cobranças do acordo devem pertencer à mesma unidade.'
                )

            if cobranca.status != 'VENCIDO':
                raise serializers.ValidationError(
                    'O acordo só pode incluir cobranças vencidas.'
                )

        return data

    def create(self, validated_data):
        cobrancas = validated_data.pop('cobrancas')
        quantidade_parcelas = validated_data.get('quantidade_parcelas')

        valor_total = Decimal('0.00')

        for cobranca in cobrancas:
            valor_total += cobranca.valor + cobranca.multa + cobranca.juros

        acordo = Acordo.objects.create(
            **validated_data,
            valor_total=valor_total
        )

        acordo.cobrancas.set(cobrancas)

        valor_parcela = valor_total / quantidade_parcelas

        for numero in range(1, quantidade_parcelas + 1):
            ParcelaAcordo.objects.create(
                acordo=acordo,
                numero_parcela=numero,
                data_vencimento=acordo.data_criacao + timedelta(days=30 * numero),
                valor=valor_parcela,
                status='PENDENTE'
            )

        return acordo