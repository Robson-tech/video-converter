/**
 * JavaScript principal para a aplicação de conversão de vídeos
 * Contém funcionalidades para copiar comandos e melhorias de UX
 */

// ===== FUNÇÃO PRINCIPAL DE CÓPIA =====
function copyToClipboard(button) {
  try {
    // Encontra o bloco de código pai
    const codeBlock = button.closest('.command-block');
    if (!codeBlock) {
      throw new Error('Bloco de código não encontrado');
    }

    // Extrai o texto do código, removendo o botão
    const preElement = codeBlock.querySelector('pre');
    const codeElement = codeBlock.querySelector('code');

    let textToCopy;
    if (preElement && codeElement) {
      textToCopy = codeElement.textContent.trim();
    } else if (preElement) {
      textToCopy = preElement.textContent.trim();
    } else {
      // Fallback: pega todo o texto do bloco, excluindo o botão
      textToCopy = codeBlock.textContent
        .replace(button.textContent, '')
        .trim();
    }

    // Remove linhas vazias extras
    textToCopy = textToCopy.replace(/\n\s*\n/g, '\n');

    // Tenta copiar usando a API moderna
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        showCopySuccess(button);
      }).catch(() => {
        fallbackCopyToClipboard(textToCopy, button);
      });
    } else {
      // Fallback para navegadores mais antigos
      fallbackCopyToClipboard(textToCopy, button);
    }
  } catch (error) {
    console.error('Erro ao copiar texto:', error);
    showCopyError(button);
  }
}

// ===== FUNÇÃO FALLBACK PARA CÓPIA =====
function fallbackCopyToClipboard(text, button) {
  try {
    // Cria um elemento textarea temporário
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);

    // Seleciona e copia o texto
    textArea.focus();
    textArea.select();

    if (document.execCommand('copy')) {
      showCopySuccess(button);
    } else {
      throw new Error('Comando copy não suportado');
    }

    // Remove o elemento temporário
    document.body.removeChild(textArea);
  } catch (error) {
    console.error('Fallback copy falhou:', error);
    showCopyError(button);
  }
}

// ===== FEEDBACK VISUAL DE SUCESSO =====
function showCopySuccess(button) {
  const originalText = button.textContent;
  const originalBackground = button.style.background;

  button.textContent = 'Copiado!';
  button.style.background = '#27ae60';
  button.style.transform = 'scale(1.05)';

  // Restaura o estado original após 2 segundos
  setTimeout(() => {
    button.textContent = originalText;
    button.style.background = originalBackground || '#3498db';
    button.style.transform = 'scale(1)';
  }, 2000);
}

// ===== FEEDBACK VISUAL DE ERRO =====
function showCopyError(button) {
  const originalText = button.textContent;
  const originalBackground = button.style.background;

  button.textContent = 'Erro!';
  button.style.background = '#e74c3c';

  // Mostra alerta para o usuário
  alert('Erro ao copiar. Selecione manualmente o texto e use Ctrl+C (Cmd+C no Mac).');

  // Restaura o estado original após 3 segundos
  setTimeout(() => {
    button.textContent = originalText;
    button.style.background = originalBackground || '#3498db';
  }, 3000);
}

// ===== MELHORIAS DE ACESSIBILIDADE =====
function addAccessibilityFeatures() {
  // Adiciona navegação por teclado para os botões de cópia
  const copyButtons = document.querySelectorAll('.copy-btn');

  copyButtons.forEach(button => {
    // Adiciona suporte para Enter e Space
    button.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        copyToClipboard(button);
      }
    });

    // Adiciona aria-label para leitores de tela
    button.setAttribute('aria-label', 'Copiar comando para área de transferência');

    // Adiciona role button se não estiver presente
    if (!button.getAttribute('role')) {
      button.setAttribute('role', 'button');
    }
  });
}

// ===== ANIMAÇÕES SUAVES =====
function addSmoothAnimations() {
  // Adiciona animação suave ao hover dos blocos de código
  const codeBlocks = document.querySelectorAll('.command-block');

  codeBlocks.forEach(block => {
    block.addEventListener('mouseenter', () => {
      block.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';
    });
  });

  // Adiciona efeito parallax suave nos boxes informativos
  const infoBoxes = document.querySelectorAll('.info-box, .warning-box');

  infoBoxes.forEach(box => {
    box.addEventListener('mouseenter', () => {
      box.style.transition = 'transform 0.2s ease';
    });
  });
}

// ===== FUNCIONALIDADE DE BUSCA =====
function addSearchFunctionality() {
  // Adiciona funcionalidade de busca rápida (Ctrl/Cmd + K)
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();

      const searchTerm = prompt('Buscar comando (deixe vazio para cancelar):');
      if (searchTerm && searchTerm.trim()) {
        highlightSearchResults(searchTerm.trim());
      }
    }
  });
}

// ===== DESTAQUE DE RESULTADOS DE BUSCA =====
function highlightSearchResults(searchTerm) {
  // Remove destaques anteriores
  removeHighlights();

  const codeBlocks = document.querySelectorAll('.command-block code, .command-block pre');
  let found = false;

  codeBlocks.forEach(block => {
    const text = block.textContent.toLowerCase();
    if (text.includes(searchTerm.toLowerCase())) {
      // Destaca o bloco encontrado
      const parentBlock = block.closest('.command-block');
      if (parentBlock) {
        parentBlock.style.border = '3px solid #f39c12';
        parentBlock.style.boxShadow = '0 0 15px rgba(243, 156, 18, 0.5)';
        parentBlock.setAttribute('data-highlighted', 'true');

        // Rola suavemente até o primeiro resultado
        if (!found) {
          parentBlock.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
        found = true;
      }
    }
  });

  if (!found) {
    alert(`Nenhum comando encontrado para: "${searchTerm}"`);
  } else {
    // Remove destaque após 5 segundos
    setTimeout(removeHighlights, 5000);
  }
}

// ===== REMOVE DESTAQUES DE BUSCA =====
function removeHighlights() {
  const highlightedBlocks = document.querySelectorAll('[data-highlighted="true"]');

  highlightedBlocks.forEach(block => {
    block.style.border = '';
    block.style.boxShadow = '';
    block.removeAttribute('data-highlighted');
  });
}

// ===== SCROLL SUAVE PARA ÂNCORAS =====
function addSmoothScrolling() {
  // Adiciona scroll suave para links âncora (se houver)
  const anchorLinks = document.querySelectorAll('a[href^="#"]');

  anchorLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href').substring(1);
      const targetElement = document.getElementById(targetId);

      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

// ===== ANALYTICS DE USO (OPCIONAL) =====
function trackUsage() {
  // Rastreia quais comandos são mais copiados (sem enviar dados)
  const usage = JSON.parse(localStorage.getItem('ffmpeg-usage') || '{}');

  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('copy-btn')) {
      const codeBlock = e.target.closest('.command-block');
      const section = codeBlock.closest('.example-section');
      const sectionTitle = section ? section.querySelector('h3').textContent : 'Geral';

      usage[sectionTitle] = (usage[sectionTitle] || 0) + 1;
      localStorage.setItem('ffmpeg-usage', JSON.stringify(usage));

      console.log('Estatísticas de uso:', usage);
    }
  });
}

// ===== MODO ESCURO (TOGGLE) =====
function addDarkModeToggle() {
  // Cria botão de modo escuro
  const darkModeBtn = document.createElement('button');
  darkModeBtn.innerHTML = '🌙';
  darkModeBtn.style.position = 'fixed';
  darkModeBtn.style.top = '20px';
  darkModeBtn.style.right = '20px';
  darkModeBtn.style.padding = '10px';
  darkModeBtn.style.border = 'none';
  darkModeBtn.style.borderRadius = '50%';
  darkModeBtn.style.background = '#3498db';
  darkModeBtn.style.color = 'white';
  darkModeBtn.style.cursor = 'pointer';
  darkModeBtn.style.fontSize = '16px';
  darkModeBtn.style.zIndex = '1000';
  darkModeBtn.setAttribute('aria-label', 'Alternar modo escuro');

  darkModeBtn.addEventListener('click', toggleDarkMode);
  document.body.appendChild(darkModeBtn);

  // Verifica se o usuário já tinha preferência salva
  if (localStorage.getItem('dark-mode') === 'enabled') {
    enableDarkMode();
    darkModeBtn.innerHTML = '☀️';
  }
}

// ===== ATIVAR MODO ESCURO =====
function enableDarkMode() {
  document.body.classList.add('dark-mode');
  localStorage.setItem('dark-mode', 'enabled');
}

// ===== DESATIVAR MODO ESCURO =====
function disableDarkMode() {
  document.body.classList.remove('dark-mode');
  localStorage.setItem('dark-mode', 'disabled');
}

// ===== ALTERNAR MODO ESCURO =====
function toggleDarkMode() {
  const darkModeBtn = document.querySelector('button[aria-label="Alternar modo escuro"]');

  if (document.body.classList.contains('dark-mode')) {
    disableDarkMode();
    darkModeBtn.innerHTML = '🌙';
  } else {
    enableDarkMode();
    darkModeBtn.innerHTML = '☀️';
  }
}

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', () => {
  console.log('📹 FFmpeg Guide - JavaScript carregado');

  // Inicializa todas as funcionalidades
  addAccessibilityFeatures();
  addSmoothAnimations();
  addSearchFunctionality();
  addSmoothScrolling();
  addDarkModeToggle();

  // Funcionalidades opcionais (descomente se desejar)
  // trackUsage();

  // Adiciona evento de redimensionamento para responsividade
  window.addEventListener('resize', () => {
    // Ajusta layout se necessário
    const codeBlocks = document.querySelectorAll('.command-block');
    codeBlocks.forEach(block => {
      if (block.scrollWidth > block.clientWidth) {
        block.style.overflowX = 'auto';
      }
    });
  });

  // Log de funcionalidades ativadas
  console.log('✅ Funcionalidades ativadas:');
  console.log('- Cópia para área de transferência');
  console.log('- Navegação por teclado');
  console.log('- Busca rápida (Ctrl/Cmd + K)');
  console.log('- Modo escuro');
  console.log('- Animações suaves');
  console.log('- Scroll suave');
});

// ===== EXPORT PARA REUTILIZAÇÃO =====
// Se necessário usar como módulo
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    copyToClipboard,
    addAccessibilityFeatures,
    addSearchFunctionality,
    toggleDarkMode
  };
}