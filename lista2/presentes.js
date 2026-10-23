/* Lista de presentes — Diandra & Guilherme
 * Integrada às funções SQL do Supabase. Sem login nem dados pessoais.
 * O código privado de cada reserva é armazenado somente no navegador do convidado.
 */
(() => {
  'use strict';

  // A prévia funciona mesmo antes de configurar o Supabase, mas NÃO salva reservas.
  const nomes = [
    'Açucareiro', 'Air fryer', 'Almofadas', 'Aromatizador de ambiente',
    'Assadeira de vidro', 'Cabides', 'Cestos organizadores', 'Chaleira elétrica',
    'Conjunto de sobremesa', 'Copos', 'Edredom', 'Escorredor de massa',
    'Escorredor de louças', 'Espelho', 'Faqueiro', 'Forma de gelo',
    'Formas de bolo', 'Frigideira',
    'Fronha e lençol com elástico (cama de casal normal)',
    'Jogo americano', 'Jogo de lençol completo', 'Jogo de taça',
    'Kit saboneteira banheiro', 'Manta de microfibra', 'Manta para sofá',
    'Panelas de cerâmica/Indução', 'Pano de prato', 'Pegador de massa/salada',
    'Petisqueira', 'Porta temperos', 'Potes de armazenamento',
    'Protetor de colchão', 'Saleiro', 'Sanduicheira', 'Suporte de detergente',
    'Tábua de cortar carne', 'Talheres', 'Tapete', 'Tapete para banheiro',
    'Toalhas de banho', 'Toalhas de mesa', 'Toalhas de rosto', 'Xícaras e Pires'
  ];

  const config = window.CONFIG_PRESENTES || {};
  const url = String(config.url || '').trim().replace(/\/+$/, '');
  const chave = String(config.chavePublica || '').trim();
  const configurado = /^https:\/\/[a-z0-9.-]+(?:\:[0-9]+)?$/i.test(url)
    && (chave.startsWith('sb_publishable_') || chave.startsWith('eyJ'));
  const prefixo = 'casamento_diandra_guilherme_reserva_';

  const els = {
    total: document.getElementById('total'),
    disponiveis: document.getElementById('disponiveis'),
    escolhidos: document.getElementById('escolhidos'),
    aviso: document.getElementById('aviso-conexao'),
    busca: document.getElementById('busca'),
    grade: document.getElementById('grade-presentes'),
    vazios: document.getElementById('sem-resultados'),
    atualizacao: document.getElementById('atualizacao'),
    modal: document.getElementById('modal'),
    modalTitulo: document.getElementById('modal-titulo'),
    modalMensagem: document.getElementById('modal-mensagem'),
    modalErro: document.getElementById('modal-erro'),
    modalEntrada: document.getElementById('modal-entrada'),
    codigoInformado: document.getElementById('codigo-informado'),
    modalCodigoArea: document.getElementById('modal-codigo-area'),
    modalCodigo: document.getElementById('modal-codigo'),
    modalCopiar: document.getElementById('copiar-codigo'),
    modalCancelar: document.getElementById('modal-cancelar'),
    modalConfirmar: document.getElementById('modal-confirmar'),
    modalFechar: document.getElementById('modal-fechar')
  };
  const estado = {
    presentes: nomes.map((nome, i) => ({ id: i + 1, nome, reservado: false })),
    filtro: 'todos',
    termo: '',
    online: false,
    requisicaoPendente: false,
    acaoPendente: false,
    modal: null
  };

  function lerCodigo(id) {
    try { return localStorage.getItem(prefixo + id); } catch { return null; }
  }
  function salvarCodigo(id, codigo) {
    try { localStorage.setItem(prefixo + id, codigo); return true; } catch { return false; }
  }
  function apagarCodigo(id) {
    try { localStorage.removeItem(prefixo + id); } catch { /* Bloqueado pelo navegador */ }
  }
  function normalizar(texto) {
    return String(texto).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }
  function aviso(texto) {
    els.aviso.hidden = !texto;
    els.aviso.textContent = texto || '';
  }

  async function rpc(funcao, parametros = {}) {
    const resposta = await fetch(`${url}/rest/v1/rpc/${funcao}`, {
      method: 'POST',
      headers: { 'apikey': chave, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(parametros),
      cache: 'no-store'
    });
    const texto = await resposta.text();
    let dados = null;
    try { dados = texto ? JSON.parse(texto) : null; } catch { /* Mensagem não JSON */ }
    if (!resposta.ok) {
      const mensagem = dados && typeof dados.message === 'string' ? dados.message : 'Erro de comunicação com o banco de dados.';
      throw new Error(mensagem);
    }
    return dados;
  }

  // Ícones ilustrativos dos itens, mantendo os cartões leves e responsivos.
  function iconeDoPresente(nome) {
    const n = normalizar(nome);
    if (/air fryer|chaleira|sanduicheira/.test(n)) return '🔌';
    if (/panela|frigideira|assadeira|forma de bolo/.test(n)) return '🍳';
    if (/copo|taca|xicara/.test(n)) return '🥂';
    if (/lencol|fronha|edredom|manta|almofada|colchao/.test(n)) return '🛏️';
    if (/toalha|tapete|saboneteira/.test(n)) return '🛁';
    if (/talher|faqueiro|pegador|tabua|escorredor/.test(n)) return '🍴';
    if (/pote|cesto|cabide|porta temperos|detergente/.test(n)) return '🧺';
    if (/aromatizador/.test(n)) return '🌸';
    if (/espelho/.test(n)) return '🪞';
    if (/sobremesa|petisqueira|americano/.test(n)) return '🍽️';
    return '🎁';
  }

  function renderizar() {
    const presentes = estado.presentes;
    const escolhidos = presentes.filter(p => p.reservado).length;
    els.total.textContent = presentes.length;
    els.disponiveis.textContent = presentes.length - escolhidos;
    els.escolhidos.textContent = escolhidos;

    const termo = normalizar(estado.termo);
    const filtrados = presentes.filter(p => {
      if (estado.filtro === 'disponiveis' && p.reservado) return false;
      if (estado.filtro === 'escolhidos' && !p.reservado) return false;
      return normalizar(p.nome).includes(termo);
    });
    els.grade.replaceChildren();
    const frag = document.createDocumentFragment();
    filtrados.forEach(presente => {
      const eSeu = presente.reservado && Boolean(lerCodigo(presente.id));
      const cartao = document.createElement('article');
      cartao.className = 'cartao';
      const topo = document.createElement('div');
      topo.className = 'cartao-topo';
      const icone = document.createElement('span');
      icone.className = 'presente-icone';
      icone.setAttribute('aria-hidden', 'true');
      icone.textContent = iconeDoPresente(presente.nome);
      const situacao = document.createElement('span');
      situacao.className = 'situacao ' + (eSeu ? 'seu' : presente.reservado ? 'escolhido' : 'disponivel');
      situacao.textContent = eSeu ? 'Sua escolha' : presente.reservado ? 'Já escolhido' : 'Disponível';
      topo.append(icone, situacao);
      const titulo = document.createElement('h3');
      titulo.textContent = presente.nome;
      const botao = document.createElement('button');
      botao.type = 'button';
      botao.className = 'acao-presente' + (presente.reservado ? ' cancelavel' : '');
      botao.dataset.id = String(presente.id);
      botao.disabled = !estado.online || estado.acaoPendente;
      botao.textContent = presente.reservado
        ? (eSeu ? 'Desmarcar minha escolha' : 'Cancelar com código')
        : 'Vou dar este presente';
      if (!estado.online) botao.title = 'As reservas estarão disponíveis após a conexão com o banco de dados.';
      cartao.append(topo, titulo, botao);
      frag.append(cartao);
    });
    els.grade.append(frag);
    els.vazios.hidden = filtrados.length > 0;
  }

  let carregamento = 0;
  async function carregarPresentes({ silencioso = false } = {}) {
    if (!configurado || estado.requisicaoPendente || estado.acaoPendente) return;
    estado.requisicaoPendente = true;
    const numero = ++carregamento;
    if (!silencioso) els.atualizacao.textContent = 'Atualizando a lista...';
    try {
      const resultado = await rpc('listar_presentes');
      if (!Array.isArray(resultado) || !resultado.every(p => Number.isInteger(p.id) && typeof p.nome === 'string' && typeof p.reservado === 'boolean')) {
        throw new Error('Resposta inesperada do banco de dados.');
      }
      if (numero !== carregamento) return;
      estado.presentes = resultado;
      estado.online = true;
      aviso('');
      els.atualizacao.textContent = 'Lista atualizada · As escolhas são sincronizadas automaticamente.';
    } catch (erro) {
      estado.online = false;
      aviso('Não foi possível acessar o banco de dados agora. As reservas estão temporariamente indisponíveis. Confira as configurações do Supabase e tente recarregar a página.');
      els.atualizacao.textContent = 'Conexão indisponível — nenhuma escolha será registrada até voltar.';
      console.error('Falha ao carregar presentes:', erro);
    } finally {
      estado.requisicaoPendente = false;
      renderizar();
    }
  }

  function mostrarErro(texto) {
    els.modalErro.hidden = false;
    els.modalErro.textContent = texto;
  }
  function abrirModal(presente) {
    if (!estado.online || estado.acaoPendente) return;
    estado.modal = { presente, modo: presente.reservado ? 'cancelar' : 'reservar' };
    els.modalErro.hidden = true;
    els.modalErro.textContent = '';
    els.modalCodigoArea.hidden = true;
    els.modalEntrada.hidden = true;
    els.codigoInformado.value = '';
    els.modalCancelar.hidden = false;
    els.modalFechar.hidden = false;
    els.modalConfirmar.disabled = false;
    if (estado.modal.modo === 'reservar') {
      els.modalTitulo.textContent = 'Confirmar presente';
      els.modalMensagem.textContent = `Você quer reservar “${presente.nome}”? Seu nome não será solicitado, e o presente ficará indisponível para os demais convidados.`;
      els.modalConfirmar.textContent = 'Sim, quero presentear';
    } else {
      const salvo = lerCodigo(presente.id);
      els.modalTitulo.textContent = 'Cancelar reserva';
      els.modalMensagem.textContent = `Você deseja liberar “${presente.nome}” para outra pessoa? ${salvo ? 'O código salvo neste navegador será utilizado.' : 'Digite o código privado entregue no momento da reserva.'}`;
      els.modalEntrada.hidden = Boolean(salvo);
      els.modalConfirmar.textContent = 'Liberar presente';
    }
    els.modal.showModal();
    if (!els.modalEntrada.hidden) els.codigoInformado.focus();
  }
  function apresentarSucesso(titulo, mensagem, codigo = null) {
    estado.modal = { presente: estado.modal.presente, modo: 'concluido' };
    els.modalTitulo.textContent = titulo;
    els.modalMensagem.textContent = mensagem;
    els.modalErro.hidden = true;
    els.modalEntrada.hidden = true;
    els.modalCodigoArea.hidden = !codigo;
    if (codigo) els.modalCodigo.textContent = codigo;
    els.modalCancelar.hidden = true;
    els.modalConfirmar.textContent = 'Concluir';
    els.modalConfirmar.disabled = false;
    els.modalFechar.hidden = false;
  }

  async function confirmarAcao() {
    if (!estado.modal || estado.acaoPendente) return;
    if (estado.modal.modo === 'concluido') { els.modal.close(); return; }
    const { presente, modo } = estado.modal;
    let codigo = '';
    if (modo === 'cancelar') {
      codigo = (lerCodigo(presente.id) || els.codigoInformado.value).trim();
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(codigo)) {
        mostrarErro('Digite um código válido no formato recebido após a reserva.');
        return;
      }
    }
    estado.acaoPendente = true;
    els.modalConfirmar.disabled = true;
    els.modalFechar.hidden = true;
    els.modalCancelar.hidden = true;
    els.modalConfirmar.textContent = 'Salvando...';
    els.modalErro.hidden = true;
    try {
      if (modo === 'reservar') {
        const codigoGerado = await rpc('reservar_presente', { p_presente_id: presente.id });
        if (!codigoGerado) {
          mostrarErro('Este presente acabou de ser escolhido por outra pessoa. Feche esta janela e escolha outro item.');
          estado.presentes = estado.presentes.map(p => p.id === presente.id ? { ...p, reservado: true } : p);
          return;
        }
        salvarCodigo(presente.id, codigoGerado);
        estado.presentes = estado.presentes.map(p => p.id === presente.id ? { ...p, reservado: true } : p);
        apresentarSucesso('Presente reservado! ♥', `Que carinho! “${presente.nome}” foi reservado com sucesso. Ninguém mais poderá reservar o mesmo item.`, codigoGerado);
      } else {
        const liberado = await rpc('cancelar_reserva', { p_presente_id: presente.id, p_codigo: codigo });
        if (liberado !== true) {
          mostrarErro('Código incorreto ou reserva não encontrada. Verifique o código e tente novamente.');
          return;
        }
        apagarCodigo(presente.id);
        estado.presentes = estado.presentes.map(p => p.id === presente.id ? { ...p, reservado: false } : p);
        apresentarSucesso('Reserva cancelada', `O presente “${presente.nome}” voltou a ficar disponível na lista.`);
      }
    } catch (erro) {
      mostrarErro('Não foi possível concluir sua solicitação. Verifique a conexão e tente novamente.');
      console.error('Falha ao atualizar reserva:', erro);
    } finally {
      estado.acaoPendente = false;
      els.modalConfirmar.disabled = false;
      els.modalFechar.hidden = false;
      if (estado.modal && estado.modal.modo !== 'concluido') {
        els.modalCancelar.hidden = false;
        els.modalConfirmar.textContent = modo === 'reservar' ? 'Sim, quero presentear' : 'Liberar presente';
      }
      renderizar();
    }
  }

  // Eventos e sincronização com outros visitantes.
  els.busca.addEventListener('input', () => { estado.termo = els.busca.value; renderizar(); });
  document.querySelectorAll('[data-filtro]').forEach(botao => {
    botao.addEventListener('click', () => {
      estado.filtro = botao.dataset.filtro;
      document.querySelectorAll('[data-filtro]').forEach(b => {
        const ativo = b === botao;
        b.classList.toggle('ativo', ativo);
        b.setAttribute('aria-pressed', String(ativo));
      });
      renderizar();
    });
  });
  els.grade.addEventListener('click', evento => {
    const botao = evento.target.closest('button[data-id]');
    if (!botao || botao.disabled) return;
    const presente = estado.presentes.find(p => p.id === Number(botao.dataset.id));
    if (presente) abrirModal(presente);
  });
  els.modalCancelar.addEventListener('click', () => els.modal.close());
  els.modalFechar.addEventListener('click', () => { if (!estado.acaoPendente) els.modal.close(); });
  els.modal.addEventListener('cancel', evento => { if (estado.acaoPendente) evento.preventDefault(); });
  els.modalConfirmar.addEventListener('click', confirmarAcao);
  els.modalCopiar.addEventListener('click', async () => {
    const codigo = els.modalCodigo.textContent;
    try {
      await navigator.clipboard.writeText(codigo);
      els.modalCopiar.textContent = 'Código copiado!';
    } catch {
      els.modalCopiar.textContent = 'Selecione o código acima para copiar';
    }
  });
  els.modal.addEventListener('close', () => {
    estado.modal = null;
    els.modalCopiar.textContent = 'Copiar código';
    if (configurado) void carregarPresentes({ silencioso: true });
  });

  if (!configurado) {
    aviso('Prévia da lista: falta conectar o Supabase. Os botões de reserva só funcionarão depois da configuração descrita no arquivo LEIA-ME.md.');
    els.atualizacao.textContent = 'Prévia dos 43 presentes · Reservas ainda não ativadas.';
    renderizar();
  } else {
    els.atualizacao.textContent = 'Conectando ao banco de dados...';
    renderizar();
    void carregarPresentes();
    setInterval(() => {
      if (document.visibilityState === 'visible' && !els.modal.open) void carregarPresentes({ silencioso: true });
    }, 30000);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') void carregarPresentes({ silencioso: true });
    });
  }
})();
