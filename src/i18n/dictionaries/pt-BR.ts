const dictionary = {
  common: {
    productName: "Badge Generate",
    skipToContent: "Pular para o conteúdo",
    loading: "Carregando...",
  },
  header: {
    homeLinkLabel: "Ir para a página inicial",
    languageSelectorLabel: "Selecionar idioma",
    switchToPortuguese: "Ver o site em português",
    switchToEnglish: "Ver o site em inglês",
  },
  footer: {
    repositoryLinkLabel: "Repositório do projeto",
    attribution: "Feito com Next.js, Bun e muito café.",
  },
  landing: {
    title: "Cards de repositório para o seu README",
    subtitle:
      "Gere um card SVG com os dados reais do seu repositório do GitHub e cole direto no README.",
    ctaGenerate: "Gerar meu card",
  },
  generator: {
    title: "Gerar card",
    subtitle: "Cole a URL completa do repositório do GitHub para gerar o card.",
    urlFieldLabel: "URL do repositório",
    urlFieldPlaceholder: "https://github.com/{owner}/{repo}",
    submitLabel: "Gerar",
    copyLabel: "Copiar snippet",
    copiedLabel: "Copiado!",
  },
  errors: {
    notFoundTitle: "Página não encontrada",
    notFoundMessage: "O endereço acessado não existe neste site.",
    unexpectedTitle: "Algo deu errado",
    unexpectedMessage:
      "Não foi possível carregar esta página. Tente novamente.",
    retryLabel: "Tentar novamente",
    backHomeLabel: "Voltar para o início",
    repositoryNotFound: "Repositório não encontrado ou privado.",
    invalidUrl: "Informe uma URL de repositório do GitHub válida.",
    rateLimited:
      "Limite de requisições atingido. Tente novamente em instantes.",
    upstreamUnavailable:
      "O GitHub não respondeu. Tente novamente em instantes.",
  },
} as const;

export default dictionary;
