# TCC-Senai-Betim-GUSTAVOHENRIQUE

Nome do projeto: SaneWeb

Integrantes da equipe: Athila Kauã, Felipe Ferreira, Gustavo Henrique, Jean Pablo, Samuel Henrique, Victor Emmanuel, Yuri Gonçalves

Descrição do projeto: O SaneWeb é uma plataforma web interativa e colaborativa, desenvolvida para promover a consciencialização ambiental e aproximar os cidadãos da gestão do saneamento básico dos seus municípios.

Tecnologias utilizadas: Tecnologias Frontend: HTML5, CSS3 puro (sem frameworks pesadas) e JavaScript (Vanilla JS). Backend e Base de Dados: Supabase (Plataforma Backend-as-a-Service baseada em PostgreSQL), responsável por armazenar utilizadores, mensagens, chamados e estatísticas de forma persistente e em tempo real. Integração de APIs: Consumo da API de Localidades do IBGE via requisições assíncronas (fetch) para carregar a lista oficial e atualizada de Estados e Municípios do Brasil.

Estrutura do repositório: / ├── tcc.html # Estrutura principal da interface, formulários e abas de navegação. ├── tcc.css # Ficheiro de estilos, contendo a paleta de cores (temática ambiental) e responsividade. ├── tcc.js # Lógica da aplicação, integração com a API do IBGE e comunicação com a base de dados do Supabase. └── README.md # Documentação do projeto.

Instruções para execução do projeto: Fazer o download ou clonar o repositório para o computador local. Certificar que o computador possui ligação ativa à internet (necessário para comunicar com o Supabase e o IBGE). Opção A (Simples): Dar um duplo clique no ficheiro index.html para abri-lo diretamente em qualquer navegador web moderno (Google Chrome, Edge, Firefox). Opção B (Recomendada para programadores): Abrir a pasta do projeto no Visual Studio Code e utilizar a extensão Live Server para emular um ambiente de servidor local. Para testar o sistema como cidadão, basta criar uma conta no botão "Criar Nova Conta". Para testar com privilégios de administrador (Gestor), basta selecionar qualquer cidade e fazer login com o utilizador admin e a palavra-passe admin.

Link da pasta do vídeo pitch: https://drive.google.com/drive/folders/1g8BAO9W_zVr4FnIzPIPZqao2D11Pf_Kf
