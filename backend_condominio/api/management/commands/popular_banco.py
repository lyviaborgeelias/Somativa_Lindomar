from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
import random

from api.models import (
    Usuario,
    Condominio,
    Unidade,
    Cobranca
)


class Command(BaseCommand):
    help = 'Popula o banco com dados de teste'

    def handle(self, *args, **kwargs):
        self.stdout.write('🔄 Limpando banco...')

        Cobranca.objects.all().delete()
        Unidade.objects.all().delete()
        Condominio.objects.all().delete()
        Usuario.objects.exclude(is_superuser=True).delete()

        # ----------------------
        # USUÁRIOS
        # ----------------------
        self.stdout.write('👤 Criando usuários...')

        admin = Usuario.objects.create_user(
            username='admin2',
            password='123456',
            nome='Admin Teste',
            tipo='ADMIN',
            is_staff=True,
            is_superuser=True
        )

        user = Usuario.objects.create_user(
            username='usuario1',
            password='123456',
            nome='Usuário Comum',
            tipo='USUARIO'
        )

        # ----------------------
        # CONDOMÍNIOS
        # ----------------------
        self.stdout.write('🏢 Criando condomínios...')

        condominios = []
        for i in range(3):
            c = Condominio.objects.create(
                nome=f'Condomínio {i+1}',
                endereco=f'Rua {i+1}'
            )
            condominios.append(c)

        # ----------------------
        # UNIDADES
        # ----------------------
        self.stdout.write('🏠 Criando unidades...')

        unidades = []
        for condominio in condominios:
            for i in range(1, 6):
                u = Unidade.objects.create(
                    condominio=condominio,
                    numero=str(i),
                    bloco='A',
                    responsavel=f'Morador {i}',
                    status='OCUPADO'
                )
                unidades.append(u)

        # ----------------------
        # COBRANÇAS
        # ----------------------
        self.stdout.write('💰 Criando cobranças...')

        hoje = timezone.now().date()

        for unidade in unidades:
            for i in range(6):  # 6 meses
                data_vencimento = hoje - timedelta(days=random.randint(0, 60))

                status = random.choice(['PAGO', 'PENDENTE', 'VENCIDO'])

                data_pagamento = None
                if status == 'PAGO':
                    data_pagamento = data_vencimento + timedelta(days=random.randint(0, 10))

                Cobranca.objects.create(
                    unidade=unidade,
                    competencia=hoje - timedelta(days=30 * i),
                    data_vencimento=data_vencimento,
                    valor=Decimal(random.randint(200, 800)),
                    status=status,
                    data_pagamento=data_pagamento,
                    forma_pagamento='PIX' if status == 'PAGO' else None
                )

        self.stdout.write(self.style.SUCCESS('✅ Banco populado com sucesso!'))