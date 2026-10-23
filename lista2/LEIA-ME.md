# Lista de presentes — Diandra & Guilherme 💍

Esta solução foi feita para o site https://guigs12.github.io/DiandraeGuilherme/, que já tem um botão de **Lista de presentes** apontando para `Lista.html`.

O site é estático (GitHub Pages), portanto as reservas são salvas no **Supabase**, que disponibiliza um banco de dados PostgreSQL. **Não é necessário contratar hospedagem de backend própria.**

## O que está pronto

- Os **43 tipos de presentes** do cartaz original foram transcritos.
- Convidados não precisam informar nome, telefone, e-mail ou criar contas.
- Presentes marcados ficam indisponíveis para novas reservas.
- Se duas pessoas clicarem ao mesmo tempo, **apenas uma reserva é aceita**, graças à chave primária no banco.
- Cada reserva retorna um **código privado**. Ele é salvo no navegador (quando permitido) e pode ser copiado para cancelar em outro aparelho.
- A lista atualiza a cada 30 segundos com a aba aberta e visível, e ao retornar à aba.
- O cartaz original, com os dados de Pix e a paleta de cores, permanece na parte inferior da página em “Ver lista original e dados de Pix”.
- A página funciona no celular e combina com as cores do site.

## Instalação — 4 etapas

### 1. Criar o projeto e as tabelas no Supabase

1. Entre em https://supabase.com/ e crie uma conta ou faça login.
2. Clique em **New project** e crie seu projeto (guarde sua senha de banco de dados em local privado; ela não entra no site).
3. No projeto, abra **SQL Editor** → **New query**.
4. Copie **todo** o conteúdo de `banco-de-dados.sql`, cole no editor e clique em **Run**.
5. Confira em **Table Editor** se foram criadas as tabelas `presentes` e `reservas`. A tabela `presentes` terá 43 linhas.

### 2. Configurar a chave pública

1. No projeto Supabase, copie o **Project URL**, no formato `https://xxxxxxxx.supabase.co`.
2. Vá ao menu **Settings → API Keys** (ou ao botão **Connect** do projeto) e encontre a chave **Publishable** (começa com `sb_publishable_`).
3. Abra `supabase-config.js` e substitua:

   ```javascript
   window.CONFIG_PRESENTES = {
     url: "https://SEU-PROJETO.supabase.co",
     chavePublica: "sb_publishable_SUA_CHAVE_AQUI"
   };
   ```

   **Nunca use `sb_secret_...`, `service_role` ou senha de banco no arquivo!** A chave publicável é própria para websites públicos, porque as permissões são limitadas pelas regras do banco.

### 3. Enviar os arquivos para o GitHub

1. Acesse seu repositório: https://github.com/Guigs12/DiandraeGuilherme
2. Na **raiz** do repositório (ao lado do `index.html`), atualize estes arquivos:
   - `Lista.html` (substituir o atual)
   - `lista.css` (substituir o atual)
   - `presentes.js` (novo)
   - `supabase-config.js` (novo e já configurado)
3. Faça **Commit changes** no branch usado pelo GitHub Pages (atualmente `main`).
4. **Não apague** as pastas `imagem`, `font` e os demais arquivos do repositório. A página utiliza `imagem/imglista.jpeg` e o botão da página principal já aponta para `Lista.html`.

O arquivo `banco-de-dados.sql` é executado no Supabase; não precisa ser publicado no site. Os arquivos `LEIA-ME.md` e o SQL podem ser guardados no seu computador ou no repositório para referência.

### 4. Testar no site publicado

Abra https://guigs12.github.io/DiandraeGuilherme/Lista.html e faça o teste:

1. Reserve um presente; guarde o código exibido.
2. Abra o mesmo endereço em uma aba anônima ou outro navegador: deve aparecer **Já escolhido**.
3. Tente reservar o mesmo presente em dois navegadores ao mesmo tempo: só um conseguirá.
4. No navegador original, clique em **Desmarcar minha escolha**, ou informe o código privado na aba anônima.
5. Confira se o presente voltou a ficar disponível.

## Como administrar sua lista

No **Supabase → SQL Editor**, você pode consultar a lista e as reservas:

```sql
select p.id, p.nome, r.reservado_em
from public.presentes p
left join public.reservas r on r.presente_id = p.id
order by p.id;
```

Para **liberar uma reserva** como administrador (exemplo: presente de ID 3), execute:

```sql
delete from public.reservas where presente_id = 3;
```

Para **renomear** um presente:

```sql
update public.presentes set nome = 'Novo nome do presente' where id = 3;
```

Para **adicionar** um presente novo:

```sql
insert into public.presentes (id, nome) values (44, 'Novo presente');
```

Observação: ao adicionar um item pelo banco, ele aparecerá automaticamente no site conectado. A prévia desconectada (`presentes.js`) é apenas um exemplo e não se atualiza com novos itens adicionados no Supabase.

Para remover um item, verifique antes se já foi reservado. O comando `delete from public.presentes where id = ...` também apagará a reserva relacionada, se houver.

## Sobre anonimato e segurança

- **Convidados** não informam dados pessoais no sistema; outros convidados visualizam apenas se cada presente está disponível ou escolhido.
- O servidor guarda somente ID do presente, código secreto e horário da reserva. O navegador pode guardar o código na memória local (`localStorage`). O provedor pode conservar registros técnicos normais de acesso (como logs).
- As tabelas estão protegidas com **RLS ativado e sem políticas de acesso direto**. Só três funções bem delimitadas são acessíveis com a chave pública: listar, reservar e cancelar com código.
- Se o código for perdido e não estiver mais salvo no navegador, o convidado não poderá cancelar por conta própria. Os noivos podem liberar o item no painel do Supabase.
- **Limitação importante:** como não há cadastro nem identificação, não é possível impedir totalmente que alguém mal-intencionado reserve vários presentes. Se isso se tornar um problema, será preciso acrescentar controle antiabuso no servidor ou autenticação leve.
- O Supabase possui planos e limites de uso que podem mudar; confira os limites atuais da sua conta.

## Perguntas frequentes

**Aparece “Prévia da lista” e os botões estão desativados.**
O arquivo `supabase-config.js` ainda tem os textos `COLE_AQUI...` ou não está sendo carregado.

**Aparece “Não foi possível acessar o banco de dados”.**
Confira se o URL e a chave pública são do mesmo projeto, se executou o SQL por inteiro e se o projeto Supabase está disponível. Veja a mensagem de erro no console do navegador (F12 → Console).

**Um presente já escolhido está aparecendo como disponível em outra aba.**
Aguarde a próxima atualização (até 30 segundos), ou recarregue a página. Mesmo que a tela esteja momentaneamente atrasada, a reserva duplicada **não** será aceita pelo banco de dados.

**A página atual pode ser alterada sem mexer no `index.html`?**
Sim. O botão “Lista de presentes” do `index.html` já aponta para `Lista.html`.

---

Criado especialmente para a página pública do casamento de Diandra e Guilherme. Não requer login dos convidados.
