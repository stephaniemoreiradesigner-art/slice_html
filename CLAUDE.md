# Diretrizes do projeto — SlicerMail Pro

## Versionamento

A cada alteração feita no código (correção, ajuste ou funcionalidade nova),
a versão do app deve ser incrementada **antes** do commit.

**Onde bumpar:** só em `client/package.json` (campo `"version"`). Esse é o
único lugar a editar — o número que aparece no canto superior direito da
tela principal (`client/src/App.jsx`) é importado direto desse arquivo
(`import { version as APP_VERSION } from '../package.json'`), então não tem
como os dois ficarem dessincronizados por esquecimento.

**Regra de incremento (semver):**
- `patch` (x.y.**Z**) — correção de bug, ajuste visual, refactor sem mudar comportamento.
- `minor` (x.**Y**.0) — funcionalidade nova (ex.: zoom no editor de zonas).
- `major` (**X**.0.0) — mudança que quebra compatibilidade (ex.: formato do HTML gerado, estrutura de `zones`, contrato da API `/api/slice`).

**No commit:** a mensagem deve começar com a versão, assim:

```
v1.1.0: fix hairline entre fatias de imagem + zoom no editor de zonas
```

Isso é o que permite, se algo quebrar em produção, olhar a versão exibida
na tela do app (ou a mensagem do commit) e saber exatamente para qual
commit voltar (`git revert <hash>` ou `git checkout <hash> -- <arquivo>`)
sem precisar caçar no histórico.

**Checklist antes de cada commit:**
1. Bumpar `client/package.json` (`"version"`).
2. Conferir que a tela principal (header do app) reflete o novo número — não precisa editar nada além do package.json, só validar visualmente se quiser.
3. Commitar com a mensagem no formato `vX.Y.Z: <resumo da mudança>`.

## Histórico de versões

| Versão | Commit | Resumo |
|---|---|---|
| 1.0.0 | `9331a37` e anteriores | Base do slicer + correção de linhas verticais/espaços em branco (font-size/line-height zerados) |
| 1.0.0 | `10b547e` | bgcolor de segurança nas fatias de imagem (hairline por arredondamento de subpixel no Chrome/Gmail) — pré-versionamento |
| 1.0.0 | `e74924d` | Zoom no editor de zonas (Step3Canvas) — pré-versionamento |
| 1.1.0 | *(a commitar)* | Versionamento passa a ser rastreado: `client/package.json` como fonte única, exibido no header via `APP_VERSION` |
| 1.1.1 | *(a commitar)* | fix: caixa branca em fatias de imagem no Gmail mobile — `background-color` estava só no `<td>`, faltava na própria tag `<img>` (quando a imagem falha de verdade em vez de só demorar, alguns webviews pintam a caixa quebrada de branco por cima do fundo do `<td>`) |
| 1.1.2 | *(a commitar)* | fix: fatias estreitas de cor lisa (margens ao lado de botões/textos, largura < ~100px) deixam de virar `<img>` — causa raiz real da caixa branca no Gmail mobile (imagem falhava ao carregar). Agora `analyzeRegion` mede o desvio-padrão de cor da região; se for uniforme e não tiver link, vira `<td bgcolor>` sólido, sem upload nem dependência de rede. Layout (largura/altura) não muda |
| 1.1.3 | *(a commitar)* | fix: o limiar de desvio-padrão da v1.1.2 (< 6) era conservador demais — colunas com leve textura/vinheta no fundo escuro continuavam virando `<img>` e quebrando no Gmail mobile mesmo sem serem "lisas" o bastante. Testado em campo (5 campanhas reais): toda coluna que quebrou tinha ≤97px, nenhuma ≥114px quebrou. Adicionado reforço por largura: qualquer coluna sem link e com ≤100px vira `<td>` sólido independente da variação de cor |
| 1.1.4 | *(a commitar)* | fix: a célula "lisa" da v1.1.2/1.1.3 (sem `<img>`) dependia só do atributo HTML `height` + `&nbsp;` com `font-size:0` pra manter a altura — sem uma `<img>` reforçando, isso podia colapsar a célula em clientes que não respeitam o atributo legado sem apoio de CSS. Agora a altura também vai explícita no `style` (`height`/`line-height` iguais à altura da célula) e o `font-size` do `&nbsp;` deixa de ser zerado (1px em vez de 0) |
| 1.1.5 | *(a commitar)* | fix (causa raiz real de todos os bgcolor errados desde a v1.1.2): `analyzeRegion`/`sampleDominantColor` chamavam `sharp(buffer).extract(region).stats()` encadeados direto — o `sharp`/`libvips` instalado (0.35.3 / vips 8.18.3) **não recorta antes de calcular estatísticas nesse encadeamento**, então `stats()` sempre lia a imagem inteira, não a região da célula. Confirmado isolando o bug com duas metades de cor oposta de uma mesma imagem: `.extract().stats()` direto devolvia a mesma cor/desvio-padrão pras duas metades; só materializando o recorte num buffer novo (`.extract().toBuffer()`) e rodando `.stats()` numa pipeline `sharp()` fresca sobre esse buffer é que a cor sai certa. Isso explica por que toda fatia "lisa" saía com a mesma cor clara (a cor dominante da imagem inteira, não da fatia) — inclusive o bug reportado nos botões (faixa cinza em vez de vermelha) e nos cantos da foto do Convém. Corrigido nos três pontos que chamavam `.stats()` depois de `.extract()`. Adicionalmente, `analyzeColumnBands` (nova função) sonda colunas estreitas em faixas verticais finas e as divide em múltiplos `<td>` empilhados quando a coluna atravessa uma transição de cor real (ex.: moldura clara de foto seguida de card escuro) — antes, toda coluna ≤100px virava uma única cor média, o que já não fazia sentido nem depois de corrigido o bug do `extract`, porque uma coluna pode legitimamente cruzar duas cores de fundo diferentes na vertical |

*(As três primeiras linhas já foram commitadas antes desta regra existir —
por isso ainda aparecem como v1.0.0. A partir da v1.1.0 em diante, todo
commit de código deve vir acompanhado de um bump.)*
