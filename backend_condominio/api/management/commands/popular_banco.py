from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
import random

from api.models import (
    Usuario,
    Condominio,
    Unidade,
    Cobranca,
    Acordo,
    ParcelaAcordo
)


class Command(BaseCommand):
    help = 'Popula o banco com dados de teste'

    def handle(self, *args, **kwargs):
        self.stdout.write('🔄 Limpando banco...')

        ParcelaAcordo.objects.all().delete()
        Acordo.objects.all().delete()
        Cobranca.objects.all().delete()
        Unidade.objects.all().delete()
        Condominio.objects.all().delete()
        Usuario.objects.all().delete()

        self.stdout.write('Criando usuários...')

        Usuario.objects.create_user(
            username='admin2',
            password='123456',
            nome='Admin Teste',
            tipo='ADMIN',
            is_staff=True,
            is_superuser=True
        )

        Usuario.objects.create_user(
            username='usuario1',
            password='123456',
            nome='Usuário Comum',
            tipo='USUARIO'
        )

        self.stdout.write('Criando condomínios...')

        condominios = []

        for i in range(3):
            condominio = Condominio.objects.create(
                nome=f'Condomínio {i + 1}',
                endereco=f'Rua {i + 1}'
            )
            condominios.append(condominio)

        self.stdout.write('Criando unidades...')

        unidades = []

        for condominio in condominios:
            for i in range(1, 6):
                unidade = Unidade.objects.create(
                    condominio=condominio,
                    numero=str(i),
                    bloco='A',
                    responsavel=f'Morador {i}',
                    status='OCUPADO'
                )
                unidades.append(unidade)

        self.stdout.write('Criando cobranças...')

        hoje = timezone.now().date()

        for unidade in unidades:
            for i in range(6):
                data_vencimento = hoje - timedelta(days=random.randint(0, 90))

                status = random.choice(['PAGO', 'PENDENTE', 'VENCIDO'])

                data_pagamento = None
                forma_pagamento = None

                if status == 'PAGO':
                    data_pagamento = data_vencimento + timedelta(days=random.randint(0, 10))
                    forma_pagamento = random.choice(['PIX', 'BOLETO'])

                Cobranca.objects.create(
                    unidade=unidade,
                    competencia=hoje - timedelta(days=30 * i),
                    data_vencimento=data_vencimento,
                    valor=Decimal(random.randint(200, 800)),
                    status=status,
                    data_pagamento=data_pagamento,
                    forma_pagamento=forma_pagamento
                )

        self.stdout.write('Criando acordos...')

        unidades_com_acordo = random.sample(unidades, 5)

        for unidade in unidades_com_acordo:
            cobrancas_vencidas = list(
                Cobranca.objects.filter(
                    unidade=unidade,
                    status='VENCIDO',
                    acordo__isnull=True
                )[:2]
            )

            if len(cobrancas_vencidas) < 2:
                continue

            valor_total = Decimal('0.00')

            for cobranca in cobrancas_vencidas:
                valor_total += cobranca.valor + cobranca.multa + cobranca.juros

            quantidade_parcelas = random.choice([2, 3, 4])
            valor_parcela = valor_total / quantidade_parcelas

            acordo = Acordo.objects.create(
                unidade=unidade,
                valor_total=valor_total,
                quantidade_parcelas=quantidade_parcelas,
            )

            acordo.cobrancas.set(cobrancas_vencidas)

            for numero in range(1, quantidade_parcelas + 1):
                vencimento = hoje + timedelta(days=30 * numero)

                cobranca_parcela = Cobranca.objects.create(
                    unidade=unidade,
                    competencia=hoje,
                    data_vencimento=vencimento,
                    valor=valor_parcela,
                    status='PENDENTE',
                    acordo=acordo,
                    numero_parcela_acordo=numero
                )

                ParcelaAcordo.objects.create(
                    acordo=acordo,
                    cobranca=cobranca_parcela,
                    numero_parcela=numero,
                    data_vencimento=vencimento,
                    valor=valor_parcela,
                    status='PENDENTE'
                )

        self.stdout.write(self.style.SUCCESS('Banco populado com sucesso!'))