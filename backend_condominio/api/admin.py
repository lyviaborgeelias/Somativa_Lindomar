from django.contrib import admin
from .models import Condominio, Unidade, Cobranca, Acordo, ParcelaAcordo, Usuario

admin.site.register(Usuario)
admin.site.register(Condominio)
admin.site.register(Unidade)
admin.site.register(Cobranca)
admin.site.register(Acordo)
admin.site.register(ParcelaAcordo)