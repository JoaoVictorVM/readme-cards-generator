# Cards Generator

Gere um card SVG com os dados reais de qualquer repositório público do GitHub e cole no README com uma linha de Markdown.

[![JoaoVictorVM/readme-cards-generator](https://readme-cards-generator.vercel.app/api/repo/JoaoVictorVM/readme-cards-generator?locale=pt-BR)](https://github.com/JoaoVictorVM/readme-cards-generator)

**Site:** [readme-cards-generator.vercel.app](https://readme-cards-generator.vercel.app)

## Como usar

1. Abra o [gerador](https://readme-cards-generator.vercel.app/gerar) e cole a URL do repositório.
2. Clique em **Gerar**. O repositório é validado e o card aparece com os dados reais.
3. Copie o snippet e cole no seu README.

O snippet tem este formato:

```markdown
[![owner/repo](https://readme-cards-generator.vercel.app/api/repo/owner/repo)](https://github.com/owner/repo)
```

O gerador aceita a URL em vários formatos: `https://github.com/owner/repo`, `github.com/owner/repo`, `owner/repo`, com `.git` no fim ou apontando para uma branch (`/tree/main`).

O card se mantém atualizado sozinho: os dados são buscados de novo no GitHub sempre que o cache do card expira (veja [API](#api)).

## O que o card mostra

- **Ícone da linguagem:** a linguagem principal do repositório, sobre um fundo tingido com a cor dela.
- **Nome** do repositório.
- **Atividade recente:** há quanto tempo foi o último push. A bolinha fica verde até 30 dias depois do push, âmbar até 180 dias e cinza a partir daí.
- **Botão** que leva à página do repositório no GitHub.

Se algo der errado (repositório inexistente, cota do GitHub esgotada, GitHub fora do ar), o endpoint continua respondendo com um SVG: um card de erro com a mensagem no idioma pedido. O README nunca fica com a imagem quebrada.

## Parâmetros

Acrescente os parâmetros na URL do card para personalizar:

| Parâmetro | Valores aceitos | Padrão | Descrição                                                                         |
| --------- | --------------- | ------ | --------------------------------------------------------------------------------- |
| `theme`   | `dark`, `light` | `dark` | Paleta do card                                                                    |
| `locale`  | `pt-BR`, `en`   | `en`   | Idioma dos textos do card                                                         |
| `width`   | `280` a `600`   | `380`  | Largura em pixels. Valores fora da faixa são ajustados para o limite mais próximo |

Valores inválidos voltam para o padrão. Exemplo com os três:

```markdown
[![vercel/next.js](https://readme-cards-generator.vercel.app/api/repo/vercel/next.js?theme=light&locale=pt-BR&width=480)](https://github.com/vercel/next.js)
```

### Vários cards lado a lado

Imagens em Markdown ficam na mesma linha se estiverem separadas por espaço, mas a coluna do README tem cerca de 830 px, e três cards de 380 px não cabem. Para três cards por linha, use largura relativa em HTML:

```html
<p>
  <a href="https://github.com/owner/repo-1"
    ><img
      width="32%"
      src="https://readme-cards-generator.vercel.app/api/repo/owner/repo-1"
      alt="owner/repo-1"
  /></a>
  <a href="https://github.com/owner/repo-2"
    ><img
      width="32%"
      src="https://readme-cards-generator.vercel.app/api/repo/owner/repo-2"
      alt="owner/repo-2"
  /></a>
  <a href="https://github.com/owner/repo-3"
    ><img
      width="32%"
      src="https://readme-cards-generator.vercel.app/api/repo/owner/repo-3"
      alt="owner/repo-3"
  /></a>
</p>
```

Como o card é SVG, ele escala sem perder nitidez.

## API

### `GET /api/repo/{owner}/{repo}`

Devolve o card como `image/svg+xml`. Aceita os parâmetros `theme`, `locale` e `width` descritos acima.

| Status        | Quando                                 | Cache                                                 |
| ------------- | -------------------------------------- | ----------------------------------------------------- |
| `200`         | Card gerado                            | `public, s-maxage=3600, stale-while-revalidate=86400` |
| `400`         | `owner` ou `repo` inválidos            | `public, s-maxage=60`                                 |
| `403`         | Cota da API do GitHub esgotada         | `public, s-maxage=60`                                 |
| `404`         | Repositório inexistente ou privado     | `public, s-maxage=60`                                 |
| `429`         | Limite de requisições deste serviço    | `no-store`                                            |
| `500` / `502` | Erro inesperado ou GitHub indisponível | `public, s-maxage=60`                                 |

Em todos os casos o corpo é um SVG, com o card ou com o card de erro.

### `GET /api/validate?owner={owner}&repo={repo}`

Usado pelo gerador para confirmar que o repositório existe antes de montar o snippet. Responde em JSON, sem cache:

```json
{ "exists": true, "owner": "vercel", "repo": "next.js" }
```

Em caso de falha, `exists` vem como `false` e `error` traz o motivo (`not_found`, `invalid_input`, `rate_limited`, `unexpected_error` e outros).

### Limite de requisições

As duas rotas aceitam até 60 requisições por minuto por IP quando o Upstash está configurado. Sem as credenciais, o limite fica desligado e o serviço continua funcionando.

## Rodando localmente

Requisito: [Bun](https://bun.sh) 1.x.

```bash
bun install
bun run dev
```

O site sobe em `http://localhost:3000`.

### Variáveis de ambiente

Todas são opcionais. O projeto instala, compila e roda sem nenhuma delas. Copie o `.env.example` para `.env.local` e preencha o que quiser:

| Variável                   | Para que serve                                                                       |
| -------------------------- | ------------------------------------------------------------------------------------ |
| `GITHUB_TOKEN`             | Token pessoal do GitHub. Aumenta a cota da API de 60 para 5.000 requisições por hora |
| `UPSTASH_REDIS_REST_URL`   | URL REST do Redis no Upstash, usada pelo limite de requisições                       |
| `UPSTASH_REDIS_REST_TOKEN` | Token REST do Redis no Upstash                                                       |

### Scripts

| Comando                | O que faz                                 |
| ---------------------- | ----------------------------------------- |
| `bun run dev`          | Servidor de desenvolvimento               |
| `bun run build`        | Build de produção                         |
| `bun run start`        | Serve o build de produção                 |
| `bun run lint`         | ESLint                                    |
| `bun run format`       | Formata o código com Prettier             |
| `bun run format:check` | Confere a formatação sem alterar arquivos |
| `bun run test`         | Testes unitários (`bun test`)             |
| `bun run test:e2e`     | Testes end-to-end com Playwright          |

Os cards de exemplo da landing (o `vercel/next.js` e os repositórios do marquee) são estáticos, para a página não depender do GitHub. Para regenerá-los com dados atuais:

```bash
GITHUB_TOKEN=seu_token bun run scripts/generate-example-card.ts
```

## Estrutura

```
src/
  app/            rotas do Next.js (landing, /gerar, /en e as rotas de API)
  components/     landing, gerador, layout e animações
  i18n/           dicionários pt-BR e en e roteamento por idioma
  lib/
    card/         renderização do SVG, temas, layout e textos do card
    github/       busca e normalização dos dados do repositório
    language-icon/ ícones das linguagens (Devicon) e cor do fundo
    repo-card/    rota do card: opções, status e cabeçalhos
    validate/     rota de validação
    rate-limit/   limite de requisições com Upstash
tests/
  unit/           testes com bun test
  e2e/            testes com Playwright
scripts/          geração dos cards de exemplo
```

## Stack

Next.js 15 (App Router), React 19, TypeScript, Bun, Tailwind CSS 4, GSAP e Lenis nas animações da landing, Upstash para o limite de requisições, Playwright nos testes end-to-end e deploy na Vercel. Os ícones das linguagens vêm do [Devicon](https://devicon.dev).

## Licença

[MIT](LICENSE) © 2026 João Victor Ventura Martins
