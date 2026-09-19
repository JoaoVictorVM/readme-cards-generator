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
    metaDescription:
      "Gere um card SVG com os dados reais do seu repositório do GitHub e cole no README com uma linha de Markdown.",
    exampleCardAlt: "Card de exemplo do repositório {repository}",
    exampleCardCaption: "Exemplo: {repository}",
    heroEyebrow: "Uma linha de Markdown. Um card SVG.",
    ctaParameters: "Ver parâmetros",
    exampleMarkdownLabel: "Markdown que gera o card abaixo",
    themesTitle: "Dois temas, uma paleta",
    themesIntro:
      "O card é preto e branco nos dois sentidos. Escolha o tema pela URL e ele acompanha o fundo do seu README.",
    themeDarkCaption: "tema escuro",
    themeLightCaption: "tema claro",
    howItWorksTitle: "Como funciona",
    step1Title: "Cole a URL do repositório",
    step1Description:
      "Informe o endereço de qualquer repositório público do GitHub.",
    step2Title: "Clique em Gerar",
    step2Description:
      "Validamos o repositório e montamos o card com os dados reais.",
    step3Title: "Copie o Markdown",
    step3Description:
      "Cole o snippet no README e o card passa a se atualizar sozinho.",
    parametersTitle: "Parâmetros da URL",
    parametersIntro:
      "O gerador usa os padrões abaixo. Para personalizar, acrescente os parâmetros diretamente na URL do card.",
    parameterNameHeader: "Parâmetro",
    parameterValuesHeader: "Valores aceitos",
    parameterDefaultHeader: "Padrão",
    parameterDescriptionHeader: "Descrição",
    themeDescription: "Paleta do card.",
    localeDescription: "Idioma dos textos do card.",
    widthDescription:
      "Largura em pixels, de {min} a {max}. Valores fora da faixa são ajustados para o limite mais próximo.",
    exampleUrlLabel: "URL de exemplo com os três parâmetros",
    copyExampleLabel: "Copiar URL",
    copiedExampleLabel: "Copiado!",
  },
  generator: {
    title: "Gerar card",
    subtitle: "Cole a URL completa do repositório do GitHub para gerar o card.",
    urlFieldLabel: "URL do repositório",
    urlFieldPlaceholder: "https://github.com/owner/repo",
    submitLabel: "Gerar",
    submittingLabel: "Verificando repositório...",
    resultHeading: "Seu card",
    emptyState: "O card aparece aqui.",
    snippetLabel: "Snippet Markdown",
    copyLabel: "Copiar snippet",
    copiedLabel: "Copiado!",
    copyFallbackLabel: "Selecione e copie",
    errorInvalidUrl: "URL de repositório inválida",
    errorNotFound: "Repositório não encontrado ou privado",
    errorQuotaExhausted:
      "Limite do GitHub atingido, tente novamente mais tarde",
    errorTooManyRequests: "Muitas requisições, aguarde um minuto",
    errorCouldNotVerify: "Não foi possível verificar agora, tente de novo",
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
