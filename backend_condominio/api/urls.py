from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    RegisterView,
    UsuarioMeView,
    UsuarioViewSet,
    CondominioViewSet,
    UnidadeViewSet,
    CobrancaViewSet,
    AcordoViewSet,
    ParcelaAcordoViewSet,
    DashboardView,
    InadimplenciaResumoView
)

router = DefaultRouter()

router.register(r'usuarios', UsuarioViewSet, basename='usuarios')
router.register(r'condominios', CondominioViewSet, basename='condominios')
router.register(r'unidades', UnidadeViewSet, basename='unidades')
router.register(r'cobrancas', CobrancaViewSet, basename='cobrancas')
router.register(r'acordos', AcordoViewSet, basename='acordos')
router.register(r'parcelas-acordo', ParcelaAcordoViewSet, basename='parcelas-acordo')

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('usuarios/me/', UsuarioMeView.as_view(), name='usuario-me'),
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    path('inadimplencia/resumo/', InadimplenciaResumoView.as_view(), name='inadimplencia-resumo'),

    path('', include(router.urls)),
]