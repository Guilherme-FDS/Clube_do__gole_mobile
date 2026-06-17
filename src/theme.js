// Paleta clara — espelha as seções brancas do site Clube do Gole
export const colors = {
  fundo: '#FAFAF8',
  fundoSecundario: '#FFFFFF',
  fundoCard: '#F5F2EC',
  texto: '#1b1a19',
  textoSecundario: '#666666',
  textoTerciario: '#999999',
  dourado: '#C9A84C',
  douradoClaro: '#E2C06A',
  douradoEscuro: '#9E7A2E',
  roxo: '#7B2FE0',
  roxoClaro: '#C49AFF',
  sucesso: '#1a7a45',
  erro: '#cc2222',
  borda: 'rgba(201, 168, 76, 0.35)',
  bordaCard: 'rgba(27, 26, 25, 0.09)',
  // hero permanece escuro como no site
  heroDark: '#1b1a19',
}

export const gradients = {
  dourado: ['#E2C06A', '#C9A84C', '#9E7A2E'],
  hero: ['#1b1a19', '#2D004D'],
}

export const spacing = {
  xs: 8,
  sm: 12,
  md: 20,
  lg: 32,
  xl: 48,
}

export const radius = {
  sm: 8,
  md: 14,
  lg: 22,
  pill: 30,
}

export const shadow = {
  card: {
    shadowColor: '#1b1a19',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  forte: {
    shadowColor: '#1b1a19',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
}
