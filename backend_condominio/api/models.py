from django.db import models
from django.utils import timezone
from decimal import Decimal
from django.contrib.auth.models import AbstractUser

class Usuario(AbstractUser):
    TIPO_CHOICES = [
        ('ADMIN', 'Administrador'),
        ('USUARIO', 'Usuário Padrão'),
    ]

    nome = models.CharField(max_length=150)
    telefone = models.CharField(max_length=20, blank=True, null=True)
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default='USUARIO')

    def __str__(self):
        return self.username
    
class Condominio(models.Model):
    nome = models.CharField(max_length=150)
    cnpj = models.CharField(max_length=18, blank=True, null=True)
    endereco = models.CharField(max_length=255)

    def __str__(self):
        return self.nome


class Unidade(models.Model):
    STATUS_CHOICES = [
        ('OCUPADO', 'Ocupado'),
        ('VAGO', 'Vago'),
    ]

    condominio = models.ForeignKey(Condominio, on_delete=models.CASCADE, related_name='unidades')
    numero = models.CharField(max_length=20)
    bloco = models.CharField(max_length=50, blank=True, null=True)
    responsavel = models.CharField(max_length=150)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='OCUPADO')

    def __str__(self):
        return f'{self.numero} - {self.condominio.nome}'


class Cobranca(models.Model):
    STATUS_CHOICES = [
        ('PENDENTE', 'Pendente'),
        ('PAGO', 'Pago'),
        ('VENCIDO', 'Vencido'),
        ('CANCELADO', 'Cancelado'),
    ]

    FORMA_PAGAMENTO_CHOICES = [
        ('BOLETO', 'Boleto'),
        ('PIX', 'Pix'),
        ('CARTAO', 'Cartão'),
    ]

    unidade = models.ForeignKey(Unidade, on_delete=models.CASCADE, related_name='cobrancas')
    competencia = models.DateField()
    data_vencimento = models.DateField()
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDENTE')
    data_pagamento = models.DateField(blank=True, null=True)
    forma_pagamento = models.CharField(max_length=20, choices=FORMA_PAGAMENTO_CHOICES, blank=True, null=True)
    multa = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    juros = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    def calcular_multa_juros(self):
        if self.status == 'PAGO' and self.data_pagamento and self.data_pagamento > self.data_vencimento:
            dias_atraso = (self.data_pagamento - self.data_vencimento).days
            self.multa = self.valor * Decimal('0.02')
            self.juros = self.valor * Decimal('0.00033') * dias_atraso
        else:
            self.multa = 0
            self.juros = 0

    def save(self, *args, **kwargs):
        if self.status == 'PAGO' and not self.data_pagamento:
            raise ValueError('A data de pagamento é obrigatória quando a cobrança está PAGA.')

        if self.status != 'PAGO' and self.data_vencimento < timezone.now().date():
            self.status = 'VENCIDO'

        self.calcular_multa_juros()
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.unidade} - {self.competencia}'


class Acordo(models.Model):
    unidade = models.ForeignKey(Unidade, on_delete=models.CASCADE, related_name='acordos')
    cobrancas = models.ManyToManyField(Cobranca, related_name='acordos')
    quantidade_parcelas = models.PositiveIntegerField()
    data_criacao = models.DateField(auto_now_add=True)
    valor_total = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    def __str__(self):
        return f'Acordo {self.id} - {self.unidade}'


class ParcelaAcordo(models.Model):
    STATUS_CHOICES = [
        ('PENDENTE', 'Pendente'),
        ('PAGO', 'Pago'),
        ('VENCIDO', 'Vencido'),
    ]

    acordo = models.ForeignKey(Acordo, on_delete=models.CASCADE, related_name='parcelas')
    numero_parcela = models.PositiveIntegerField()
    data_vencimento = models.DateField()
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDENTE')

    def __str__(self):
        return f'Parcela {self.numero_parcela} - Acordo {self.acordo.id}'