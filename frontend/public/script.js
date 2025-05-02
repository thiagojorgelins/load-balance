document.addEventListener('DOMContentLoaded', () => {
  const mainContent = document.getElementById('mainContent');
  const pageTitle = document.getElementById('pageTitle');
  const pageSubtitle = document.getElementById('pageSubtitle');
  const showPostsBtn = document.getElementById('showPostsBtn');
  const createPostBtn = document.getElementById('createPostBtn');
  let currentPage = 1;
  let totalPages = 1;

  const clearMainContent = () => {
    mainContent.innerHTML = '';
  };

  const showLoading = () => {
    clearMainContent();
    const loadingElement = document.createElement('div');
    loadingElement.className = 'loading';
    loadingElement.textContent = 'Carregando...';
    mainContent.appendChild(loadingElement);
    return loadingElement;
  };

  const showError = (message) => {
    clearMainContent();
    const errorElement = document.createElement('div');
    errorElement.className = 'error';
    errorElement.textContent = message;
    mainContent.appendChild(errorElement);
  };

  const createStatusMessage = (message, isSuccess) => {
    const statusElement = document.createElement('div');
    statusElement.className = `status-message ${isSuccess ? 'success' : 'error'}`;
    statusElement.style.display = 'block';
    statusElement.textContent = message;
    return statusElement;
  };

  const updateServerInfo = (serverId) => {
    currentServerId = serverId;
    const serverInfoElement = document.getElementById('serverInfo');

    if (serverInfoElement) {
      serverInfoElement.textContent = `Servidor: ${serverId}`;
      serverInfoElement.classList.add('server-updated');

      setTimeout(() => {
        serverInfoElement.classList.remove('server-updated');
      }, 1000);
    } else {
      const newServerInfo = document.createElement('div');
      newServerInfo.id = 'serverInfo';
      newServerInfo.className = 'server-info';
      newServerInfo.textContent = `Servidor: ${serverId}`;
      document.querySelector('header').appendChild(newServerInfo);
    }
  };

  const fetchPosts = async (page = 1) => {
    try {
      const response = await fetch(`/api/posts?page=${page}`);

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status}`);
      }

      const data = await response.json();

      if (data.serverId) {
        updateServerInfo(data.serverId);
        currentServerId = data.serverId;
      }

      currentPage = data.page || 1;
      totalPages = data.totalPages || 1;

      return data.posts || [];
    } catch (error) {
      console.error('Erro ao buscar posts:', error);
      throw error;
    }
  };


  const submitPost = async (postData) => {
    try {
      const response = await fetch("/api/posts", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
      });

      if (!response.ok) {
        throw new Error(`Erro ao criar post: ${response.status}`);
      }

      const data = await response.json();

      // Atualizar informação do servidor
      if (data.serverId) {
        updateServerInfo(data.serverId);
        currentServerId = data.serverId;
      }

      return data;
    } catch (error) {
      console.error('Erro ao enviar post:', error);
      throw error;
    }
  };

  const renderPostsView = async (page = 1) => {
    pageTitle.textContent = 'Meus Posts';
    pageSubtitle.textContent = 'Lista de conteúdos';

    showLoading();

    try {
      const posts = await fetchPosts(page);
      clearMainContent();

      const container = document.createElement('div');
      container.className = 'container';
      mainContent.appendChild(container);

      if (posts.length === 0) {
        const noPostsMessage = document.createElement('div');
        noPostsMessage.className = 'loading';
        noPostsMessage.textContent = 'Nenhum post encontrado.';
        container.appendChild(noPostsMessage);
        return;
      }

      posts.forEach(post => {
        const card = document.createElement('div');
        card.className = 'card';

        const cardTitle = document.createElement('div');
        cardTitle.className = 'card-title';
        cardTitle.textContent = post.title || 'Sem título';

        const cardContent = document.createElement('div');
        cardContent.className = 'card-content';
        cardContent.textContent = post.content || post.body || 'Sem conteúdo';

        card.appendChild(cardTitle);
        card.appendChild(cardContent);

        container.appendChild(card);
      });

      renderPaginationControls();

    } catch (error) {
      showError(`Não foi possível carregar os posts: ${error.message}`);
    }
  };

  const renderPaginationControls = () => {
    const pagination = document.createElement('div');
    pagination.className = 'btn-container';

    const prevBtn = document.createElement('button');
    prevBtn.textContent = '← Anterior';
    prevBtn.className = 'btn btn-secondary';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => renderPostsView(currentPage - 1);

    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Próxima →';
    nextBtn.className = 'btn btn-primary';
    nextBtn.disabled = currentPage >= totalPages;
    nextBtn.onclick = () => renderPostsView(currentPage + 1);

    pagination.appendChild(prevBtn);
    pagination.appendChild(nextBtn);
    mainContent.appendChild(pagination);
  };

  const renderCreatePostView = () => {
    pageTitle.textContent = 'Criar Novo Post';
    pageSubtitle.textContent = 'Adicione conteúdo à plataforma';

    clearMainContent();

    const formCard = document.createElement('div');
    formCard.className = 'form-card';

    const form = document.createElement('form');
    form.id = 'postForm';

    const titleGroup = document.createElement('div');
    titleGroup.className = 'form-group';

    const titleLabel = document.createElement('label');
    titleLabel.htmlFor = 'postTitle';
    titleLabel.textContent = 'Título';

    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.id = 'postTitle';
    titleInput.name = 'title';
    titleInput.placeholder = 'Digite o título do post';
    titleInput.required = true;

    titleGroup.appendChild(titleLabel);
    titleGroup.appendChild(titleInput);

    const contentGroup = document.createElement('div');
    contentGroup.className = 'form-group';

    const contentLabel = document.createElement('label');
    contentLabel.htmlFor = 'postContent';
    contentLabel.textContent = 'Conteúdo';

    const contentInput = document.createElement('textarea');
    contentInput.id = 'postContent';
    contentInput.name = 'content';
    contentInput.placeholder = 'Digite o conteúdo do post';
    contentInput.required = true;

    contentGroup.appendChild(contentLabel);
    contentGroup.appendChild(contentInput);

    const btnContainer = document.createElement('div');
    btnContainer.className = 'btn-container';

    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'btn btn-secondary';
    clearBtn.textContent = 'Limpar';

    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'btn btn-primary';
    submitBtn.textContent = 'Publicar Post';

    btnContainer.appendChild(clearBtn);
    btnContainer.appendChild(submitBtn);

    form.appendChild(titleGroup);
    form.appendChild(contentGroup);
    form.appendChild(btnContainer);

    const statusContainer = document.createElement('div');
    statusContainer.id = 'statusContainer';

    formCard.appendChild(form);
    formCard.appendChild(statusContainer);

    mainContent.appendChild(formCard);

    clearBtn.addEventListener('click', () => {
      form.reset();
      statusContainer.innerHTML = '';
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!titleInput.value.trim() || !contentInput.value.trim()) {
        statusContainer.innerHTML = '';
        statusContainer.appendChild(
          createStatusMessage('Por favor, preencha todos os campos', false)
        );
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando...';

      try {
        const postData = {
          title: titleInput.value.trim(),
          content: contentInput.value.trim(),
        };

        const result = await submitPost(postData);

        updateServerInfo(result.serverId);

        statusContainer.innerHTML = '';
        statusContainer.appendChild(
          createStatusMessage(`Post criado com sucesso!`, true)
        );

        form.reset();

        setTimeout(() => {
          renderPostsView();
        }, 1000);

      } catch (error) {
        statusContainer.innerHTML = '';
        statusContainer.appendChild(
          createStatusMessage(`Falha ao criar post: ${error.message}`, false)
        );
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Publicar Post';
      }
    });
  };


  showPostsBtn.addEventListener('click', renderPostsView);
  createPostBtn.addEventListener('click', renderCreatePostView);

  renderPostsView();

});