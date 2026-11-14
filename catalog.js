window.EL_DEMOS=[
  {
    "id": "grafos-bfs",
    "topic": "Grafos",
    "title": "Uma amizade encurta o caminho",
    "application": "Uma rede social encontra quem pode apresentar você a Eva.",
    "connection": "Matrizes de adjacência guardam quem conhece quem; o grafo torna essas relações visíveis.",
    "source": {
      "label": "Referência · conexões em grafos",
      "url": "https://networkx.org/documentation/stable/reference/algorithms/traversal.html"
    }
  },
  {
    "id": "grafos-dijkstra",
    "topic": "Grafos",
    "title": "O trânsito mudou. A rota também.",
    "application": "Um aplicativo escolhe por onde ir para chegar à loja mais rápido.",
    "connection": "Grafos representam os caminhos; os números de uma matriz podem registrar o tempo entre lugares.",
    "source": {
      "label": "Referência · escolha de rotas",
      "url": "https://networkx.org/documentation/stable/reference/algorithms/shortest_paths.html"
    }
  },
  {
    "id": "grafos-pagerank",
    "topic": "Grafos",
    "title": "Um link ajuda uma página a aparecer",
    "application": "Um buscador usa as indicações entre páginas como um sinal de destaque.",
    "connection": "Matrizes representam os links e ajudam a calcular o destaque de cada página.",
    "source": {
      "label": "Referência · destaque de páginas",
      "url": "https://networkx.org/documentation/stable/reference/algorithms/link_analysis.html"
    }
  },
  {
    "id": "numpy-imagem",
    "topic": "NumPy",
    "title": "Realçar as cores de uma imagem",
    "application": "Ao realçar uma imagem, o editor aumenta a intensidade da cor em todos os pixels juntos.",
    "connection": "NumPy → a mesma conta aplicada à imagem inteira.",
    "source": {
      "label": "Documentação NumPy",
      "url": "https://numpy.org/doc/stable/reference/generated/numpy.clip.html"
    }
  },
  {
    "id": "numpy-lote",
    "topic": "NumPy",
    "title": "Mover vários personagens juntos",
    "application": "Uma rajada de vento empurra todos os personagens de um jogo na mesma direção.",
    "connection": "NumPy → somar o mesmo deslocamento a várias posições.",
    "source": {
      "label": "Documentação NumPy",
      "url": "https://numpy.org/doc/stable/user/basics.broadcasting.html"
    }
  },
  {
    "id": "numpy-normalizacao",
    "topic": "NumPy",
    "title": "Comparar sensores diferentes",
    "application": "Uma estufa acompanha temperatura e umidade, duas medidas que usam unidades diferentes.",
    "connection": "NumPy → ajustar colunas de dados para uma escala comum.",
    "source": {
      "label": "Documentação NumPy",
      "url": "https://numpy.org/doc/stable/user/basics.broadcasting.html"
    }
  },
  {
    "id": "vetores-movimento",
    "topic": "Vetores e matrizes",
    "title": "Direção e velocidade em um jogo",
    "application": "Ao mover o controle de um jogo, você escolhe para onde e quão rápido o personagem anda.",
    "connection": "Vetores → direção e velocidade do personagem.",
    "source": {
      "label": "Documentação NumPy",
      "url": "https://numpy.org/doc/stable/reference/generated/numpy.linalg.norm.html"
    }
  },
  {
    "id": "matrizes-pixels",
    "topic": "Vetores e matrizes",
    "title": "Desenhar com pixels",
    "application": "Um desenho digital é formado por pequenos quadrados que podem ser alterados separadamente.",
    "connection": "Matrizes → linhas e colunas de pixels formam uma imagem.",
    "source": {
      "label": "Documentação NumPy",
      "url": "https://numpy.org/doc/stable/user/basics.indexing.html"
    }
  },
  {
    "id": "vetores-perfis",
    "topic": "Vetores e matrizes",
    "title": "Um jogo combina com você?",
    "application": "Uma loja de jogos compara seus gostos com as características de cada jogo.",
    "connection": "Vetores → uma lista de números representa seus gostos.",
    "source": {
      "label": "Documentação NumPy",
      "url": "https://numpy.org/doc/stable/reference/generated/numpy.linalg.norm.html"
    }
  },
  {
    "id": "operacoes-iluminacao",
    "topic": "Operações vetoriais e matriciais",
    "title": "De que lado vem a luz?",
    "application": "Em um jogo 3D, uma superfície recebe mais luz quando está voltada para a fonte.",
    "connection": "Produto escalar → quanto de luz uma superfície recebe.",
    "source": {
      "label": "MDN · iluminação em WebGL",
      "url": "https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Lighting_in_WebGL"
    }
  },
  {
    "id": "operacoes-recomendacao",
    "topic": "Operações vetoriais e matriciais",
    "title": "Qual jogo indicar para você?",
    "application": "Uma loja organiza suas sugestões de jogos de acordo com o que você mais gosta.",
    "connection": "Matriz × vetor → comparar vários jogos com suas preferências.",
    "source": {
      "label": "Documentação NumPy",
      "url": "https://numpy.org/doc/stable/reference/generated/numpy.matmul.html"
    }
  },
  {
    "id": "operacoes-composicao",
    "topic": "Operações vetoriais e matriciais",
    "title": "Esticar e girar: a ordem importa",
    "application": "Em um editor de imagens, girar antes de esticar pode produzir uma figura diferente.",
    "connection": "Multiplicação de matrizes → combinar transformações na ordem certa.",
    "source": {
      "label": "Documentação NumPy",
      "url": "https://numpy.org/doc/stable/reference/generated/numpy.matmul.html"
    }
  },
  {
    "id": "simples-transferencia",
    "topic": "Regressão linear simples",
    "title": "Quanto tempo para enviar o arquivo?",
    "application": "O aplicativo prevê quanto tempo um arquivo levará para chegar à nuvem.",
    "connection": "Regressão simples → usa o tamanho do arquivo para estimar o tempo.",
    "source": {
      "label": "NIST · mínimos quadrados",
      "url": "https://www.itl.nist.gov/div898/handbook/pmd/section1/pmd141.htm"
    }
  },
  {
    "id": "simples-processamento",
    "topic": "Regressão linear simples",
    "title": "Quanto tempo para ler uma planilha?",
    "application": "Um sistema prevê a espera antes de importar os registros de uma planilha.",
    "connection": "Regressão simples → relaciona quantidade de registros e tempo de leitura.",
    "source": {
      "label": "NIST · mínimos quadrados",
      "url": "https://www.itl.nist.gov/div898/handbook/pmd/section1/pmd141.htm"
    }
  },
  {
    "id": "simples-calibracao",
    "topic": "Regressão linear simples",
    "title": "Como o termômetro sabe a temperatura?",
    "application": "O termômetro digital transforma um sinal elétrico em temperatura.",
    "connection": "Regressão simples → liga o sinal do sensor à temperatura mostrada na tela.",
    "source": {
      "label": "NIST · mínimos quadrados",
      "url": "https://www.itl.nist.gov/div898/handbook/pmd/section1/pmd141.htm"
    }
  },
  {
    "id": "multipla-api",
    "topic": "Regressão linear múltipla",
    "title": "Por que o aplicativo ficou lento?",
    "application": "O servidor prevê a espera ao combinar dados enviados e pessoas usando o aplicativo.",
    "connection": "Regressão múltipla → combina tamanho dos dados e número de usuários.",
    "source": {
      "label": "scikit-learn · modelos lineares",
      "url": "https://scikit-learn.org/stable/modules/linear_model.html"
    }
  },
  {
    "id": "multipla-render",
    "topic": "Regressão linear múltipla",
    "title": "Mais detalhes deixam o jogo pesado?",
    "application": "O jogo estima o tempo de desenhar a cena conforme você adiciona objetos e luzes.",
    "connection": "Regressão múltipla → combina objetos e luzes para prever o desempenho.",
    "source": {
      "label": "scikit-learn · modelos lineares",
      "url": "https://scikit-learn.org/stable/modules/linear_model.html"
    }
  },
  {
    "id": "multipla-potencia",
    "topic": "Regressão linear múltipla",
    "title": "Quanto o computador está consumindo?",
    "application": "O computador estima o consumo elétrico conforme processador e memória trabalham.",
    "connection": "Regressão múltipla → combina o uso de processador e memória.",
    "source": {
      "label": "scikit-learn · modelos lineares",
      "url": "https://scikit-learn.org/stable/modules/linear_model.html"
    }
  },
  {
    "id": "polinomial-trajetoria",
    "topic": "Regressão polinomial",
    "title": "Por onde a bola vai passar?",
    "application": "Um rastreador de vídeo usa as posições vistas pela câmera para prever o caminho da bola.",
    "connection": "Regressão polinomial → usa uma curva para acompanhar a subida e a descida.",
    "source": {
      "label": "scikit-learn · subajuste e sobreajuste",
      "url": "https://scikit-learn.org/stable/auto_examples/model_selection/plot_underfitting_overfitting.html"
    }
  },
  {
    "id": "polinomial-sensor",
    "topic": "Regressão polinomial",
    "title": "O robô está perto do obstáculo?",
    "application": "Um robô transforma o sinal de um sensor em distância até o objeto à frente.",
    "connection": "Regressão polinomial → traduz um sensor cuja resposta segue uma curva.",
    "source": {
      "label": "scikit-learn · subajuste e sobreajuste",
      "url": "https://scikit-learn.org/stable/auto_examples/model_selection/plot_underfitting_overfitting.html"
    }
  },
  {
    "id": "polinomial-bateria",
    "topic": "Regressão polinomial",
    "title": "Uma curva complicada prevê melhor?",
    "application": "O celular usa medidas anteriores para prever quanta bateria restará durante o uso.",
    "connection": "Regressão polinomial → curvas mais complicadas nem sempre fazem previsões melhores.",
    "source": {
      "label": "scikit-learn · subajuste e sobreajuste",
      "url": "https://scikit-learn.org/stable/auto_examples/model_selection/plot_underfitting_overfitting.html"
    }
  },
  {
    "id": "gradiente-download",
    "topic": "Gradiente descendente",
    "title": "Estimar o tempo de download",
    "application": "O app aprende com downloads anteriores para estimar quanto um novo arquivo vai demorar.",
    "connection": "Gradiente descendente → corrige pequenos erros até melhorar a previsão.",
    "source": {
      "label": "Google · gradiente descendente",
      "url": "https://developers.google.com/machine-learning/crash-course/linear-regression/gradient-descent"
    }
  },
  {
    "id": "gradiente-spam",
    "topic": "Gradiente descendente",
    "title": "Aprender a separar spam",
    "application": "O filtro aprende com mensagens conhecidas para reconhecer uma oferta suspeita.",
    "connection": "Vetores e gradiente → usam sinais da mensagem para melhorar o filtro.",
    "source": {
      "label": "Google · regressão logística",
      "url": "https://developers.google.com/machine-learning/crash-course/logistic-regression"
    }
  },
  {
    "id": "gradiente-alinhamento",
    "topic": "Gradiente descendente",
    "title": "Alinhar duas capturas",
    "application": "Um editor sobrepõe duas capturas do mesmo lugar para alinhar suas formas.",
    "connection": "Gradiente e translação → aproximam pontos que deveriam coincidir.",
    "source": {
      "label": "SimpleITK · registro e otimização",
      "url": "https://simpleitk.readthedocs.io/en/v2.5.0/link_ImageRegistrationOptimizerWeights_docs.html"
    }
  },
  {
    "id": "grafica-sprite",
    "topic": "Computação Gráfica",
    "title": "Girar e aumentar a nave do jogo",
    "application": "O jogo gira e aumenta a nave sem precisar desenhá-la de novo.",
    "connection": "Matrizes → giram e redimensionam os objetos do jogo.",
    "source": {
      "label": "MDN · matrizes e projeção WebGL",
      "url": "https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_model_view_projection"
    }
  },
  {
    "id": "grafica-camera",
    "topic": "Computação Gráfica",
    "title": "Aproximar a câmera muda a cena",
    "application": "Ao aproximar a câmera, o mesmo objeto ocupa mais espaço na tela.",
    "connection": "Projeção → transforma uma cena 3D nos pixels que vemos.",
    "source": {
      "label": "MDN · matrizes e projeção WebGL",
      "url": "https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_model_view_projection"
    }
  },
  {
    "id": "grafica-braco",
    "topic": "Computação Gráfica",
    "title": "Animar um braço articulado",
    "application": "A mão continua ligada ao braço enquanto o personagem levanta o braço ou acena.",
    "connection": "Matrizes em sequência → fazem a mão acompanhar o braço do personagem.",
    "source": {
      "label": "MDN · matrizes e projeção WebGL",
      "url": "https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_model_view_projection"
    }
  },
  {
    "id": "sistemas-retas",
    "topic": "Sistemas lineares",
    "title": "Dois pedidos revelam os preços",
    "application": "A lanchonete só guardou o total de dois pedidos. Com eles, dá para descobrir o preço do hambúrguer e do suco.",
    "connection": "Cada pedido é uma equação; a solução do sistema é o ponto onde as duas retas se cruzam. Se o determinante é zero, não há resposta única.",
    "source": {
      "label": "Referência · sistemas lineares",
      "url": "https://numpy.org/doc/stable/reference/generated/numpy.linalg.solve.html"
    }
  },
  {
    "id": "sistemas-gauss",
    "topic": "Sistemas lineares",
    "title": "Três notas fiscais, três preços",
    "application": "Um app de controle de gastos descobre o preço de cada item só com os totais de três notas fiscais.",
    "connection": "A eliminação gaussiana zera os coeficientes abaixo da diagonal; depois, a substituição de trás para frente revela cada incógnita.",
    "source": {
      "label": "Referência · eliminação gaussiana",
      "url": "https://numpy.org/doc/stable/reference/generated/numpy.linalg.solve.html"
    }
  },
  {
    "id": "sistemas-gauss-seidel",
    "topic": "Sistemas lineares",
    "title": "Chutar e corrigir: Gauss-Seidel",
    "application": "Um simulador estima a temperatura ao longo de uma barra aquecida corrigindo um palpite a cada rodada, como fazem programas de engenharia com milhares de equações.",
    "connection": "Cada ponto obedece a uma equação: sua temperatura é a média dos vizinhos. Gauss-Seidel resolve o sistema aos poucos, usando sempre o valor mais novo.",
    "source": {
      "label": "Referência · métodos iterativos",
      "url": "https://en.wikipedia.org/wiki/Gauss%E2%80%93Seidel_method"
    }
  },
  {
    "id": "autovalores-direcao",
    "topic": "Autovalores e autovetores",
    "title": "A direção que não gira",
    "application": "Ao esticar uma foto, quase toda direção entorta. Algumas só aumentam ou diminuem: são os autovetores da transformação.",
    "connection": "Av = λv: o autovetor v mantém a direção, e o autovalor λ diz quanto ele estica. Esse é o coração do PageRank, da compressão de imagens e do PCA.",
    "source": {
      "label": "Referência · autovalores no NumPy",
      "url": "https://numpy.org/doc/stable/reference/generated/numpy.linalg.eig.html"
    }
  },
  {
    "id": "autovalores-markov",
    "topic": "Autovalores e autovetores",
    "title": "Para onde vai a audiência?",
    "application": "Um serviço de streaming estima quantos assinantes ele e o concorrente terão no longo prazo, mês após mês.",
    "connection": "Multiplicar pela mesma matriz várias vezes leva ao autovetor de λ = 1. Diagonalizar a matriz mostra por que: os outros autovalores encolhem a cada mês.",
    "source": {
      "label": "Referência · cadeias de Markov",
      "url": "https://en.wikipedia.org/wiki/Markov_chain#Stationary_distribution_relation_to_eigenvectors_and_simplices"
    }
  },
  {
    "id": "autovalores-base",
    "topic": "Autovalores e autovetores",
    "title": "Dois botões alcançam a tela toda?",
    "application": "Um jogo move o personagem com dois botões de direção. Com direções independentes, ele chega a qualquer ponto; se forem paralelas, fica preso em uma linha.",
    "connection": "Vetores linearmente independentes formam uma base: qualquer ponto vira a·u + b·v. Se forem dependentes, o determinante é zero e parte do plano fica inalcançável.",
    "source": {
      "label": "Referência · base e independência linear",
      "url": "https://numpy.org/doc/stable/reference/generated/numpy.linalg.matrix_rank.html"
    }
  }
];
