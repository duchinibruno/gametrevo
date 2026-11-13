// Normalizador de texto para validação flexível de respostas
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?'"“”]/g, '') // remove pontuações
    .replace(/\s+/g, ' ')
    .trim();
}

// Gera a dica estrita de padrão com interrogações para cada caractere
// Exemplo: "101 Dálmatas" -> "101 D???????"
// Exemplo: "7 Dias na Semana" -> "7 D??? na S?????"
export function generatePatternHint(answer: string): string {
  if (!answer) return '';

  const shortWords = new Set([
    'de', 'do', 'da', 'dos', 'das',
    'em', 'no', 'na', 'nos', 'nas',
    'por', 'para', 'com', 'sem', 'sob', 'sobre',
    'e', 'ou', 'a', 'o', 'as', 'os', 'um', 'uma'
  ]);

  const words = answer.trim().split(/\s+/);

  return words.map((word) => {
    // Preserva pontuações finais se houver (ex: virgula, ponto, interrogação)
    const match = word.match(/^([a-zA-Z0-9À-ÿ]+)([^a-zA-Z0-9À-ÿ]*)$/);
    if (!match) return word;

    const [_, core, punctuation] = match;

    // Se for número (ex: "7", "101", "2026")
    if (/^\d+$/.test(core)) {
      return core + punctuation;
    }

    // Se for palavra curta de ligação (preposição / conjunção)
    const lowerCore = core.toLowerCase();
    if (shortWords.has(lowerCore)) {
      return lowerCore + punctuation;
    }

    // Palavra principal: Mantém a 1ª letra maiúscula e preenche o restante com ?
    const firstLetter = core.charAt(0).toUpperCase();
    const remainingCount = Math.max(0, core.length - 1);
    const masked = firstLetter + '?'.repeat(remainingCount);

    return masked + punctuation;
  }).join(' ');
}

// Verifica se a resposta do usuário está correta
export function checkAnswer(userAnswer: string, correctAnswer: string): boolean {
  let normUser = normalizeText(userAnswer);
  let normCorrect = normalizeText(correctAnswer);

  if (!normUser || !normCorrect) return false;
  if (normUser === normCorrect) return true;

  // Se remover artigos no início (o, a, os, as)
  const stripArticles = (s: string) => s.replace(/^(o|a|os|as)\s+/, '');
  if (stripArticles(normUser) === stripArticles(normCorrect)) return true;

  // Substituição de numerais comuns por extenso para dígitos
  const numberMap: Record<string, string> = {
    'cento e um': '101',
    'zero zero sete': '007',
    'um': '1', 'uma': '1',
    'dois': '2', 'duas': '2',
    'tres': '3',
    'quatro': '4',
    'cinco': '5',
    'seis': '6',
    'sete': '7',
    'oito': '8',
    'nove': '9',
    'dez': '10',
    'onze': '11',
    'doze': '12',
    'vinte': '20',
    'vinte e quatro': '24',
    'trinta': '30',
    'sessenta': '60',
    'noventa': '90',
    'cem': '100',
    'trezentos e sessenta e cinco': '365'
  };

  let replacedUser = stripArticles(normUser);
  for (const [extenso, digito] of Object.entries(numberMap)) {
    const regex = new RegExp(`\\b${extenso}\\b`, 'g');
    replacedUser = replacedUser.replace(regex, digito);
  }

  let replacedCorrect = stripArticles(normCorrect);
  for (const [extenso, digito] of Object.entries(numberMap)) {
    const regex = new RegExp(`\\b${extenso}\\b`, 'g');
    replacedCorrect = replacedCorrect.replace(regex, digito);
  }

  return replacedUser === replacedCorrect;
}

export interface DitloidItem {
  enigma: string;
  answer: string;
  hint: string;
}

// Banco pré-cadastrado com mais de 20 enigmas por categoria temática
export const THEME_PRESETS: Record<string, DitloidItem[]> = {
  'Geral e Cotidiano': [
    { enigma: '7 D na S', answer: '7 Dias na Semana', hint: '7 D??? na S?????' },
    { enigma: '12 M no A', answer: '12 Meses no Ano', hint: '12 M???? no A??' },
    { enigma: '24 H no D', answer: '24 Horas no Dia', hint: '24 H???? no D??' },
    { enigma: '4 E do A', answer: '4 Estações do Ano', hint: '4 E??????? do A??' },
    { enigma: '365 D no A', answer: '365 Dias no Ano', hint: '365 D??? no A??' },
    { enigma: '26 L no A', answer: '26 Letras no Alfabeto', hint: '26 L????? no A???????' },
    { enigma: '5 D em cada M', answer: '5 Dedos em cada Mão', hint: '5 D???? em cada M??' },
    { enigma: '60 M em 1 H', answer: '60 Minutos em 1 Hora', hint: '60 M?????? em 1 H???' },
    { enigma: '60 S em 1 M', answer: '60 Segundos em 1 Minuto', hint: '60 S??????? em 1 M?????' },
    { enigma: '100 A em 1 S', answer: '100 Anos em 1 Século', hint: '100 A??? em 1 S?????' },
    { enigma: '1000 M em 1 K', answer: '1000 Metros em 1 Quilômetro', hint: '1000 M????? em 1 Q?????????' },
    { enigma: '7 C no A-I', answer: '7 Cores no Arco-Íris', hint: '7 C???? no A???-Í???' },
    { enigma: '32 D na B de um A', answer: '32 Dentes na Boca de um Adulto', hint: '32 D????? na B??? de um A?????' },
    { enigma: '206 O no C H', answer: '206 Ossos no Corpo Humano', hint: '206 O???? no C???? H?????' },
    { enigma: '8 B em 1 B', answer: '8 Bits em 1 Byte', hint: '8 B??? em 1 B???' },
    { enigma: '1000 G em 1 Q', answer: '1000 Gramas em 1 Quilo', hint: '1000 G????? em 1 Q????' },
    { enigma: '3 L em um T', answer: '3 Lados em um Triângulo', hint: '3 L???? em um T????????' },
    { enigma: '4 L em um Q', answer: '4 Lados em um Quadrado', hint: '4 L???? em um Q???????' },
    { enigma: '360 G em um C', answer: '360 Graus em um Círculo', hint: '360 G???? em um C??????' },
    { enigma: '10 D na D', answer: '10 Dedos nos Pés', hint: '10 D???? nos P??' },
    { enigma: '2 O e 2 O', answer: '2 Olhos e 2 Ouvidos', hint: '2 O???? e 2 O??????' }
  ],
  'Futebol e Esportes': [
    { enigma: '11 J em um T de F', answer: '11 Jogadores em um Time de Futebol', hint: '11 J???????? em um T??? de F??????' },
    { enigma: '90 M em uma P de F', answer: '90 Minutos em uma Partida de Futebol', hint: '90 M?????? em uma P?????? de F??????' },
    { enigma: '2 T de 45 M', answer: '2 Tempos de 45 Minutos', hint: '2 T????? de 45 M??????' },
    { enigma: '5 T de C do M do B', answer: '5 Títulos de Copa do Mundo do Brasil', hint: '5 T?????? de C??? do M???? do B?????' },
    { enigma: '4 A entre cada C do M', answer: '4 Anos entre cada Copa do Mundo', hint: '4 A??? entre cada C??? do M????' },
    { enigma: '4 A entre cada J O', answer: '4 Anos entre cada Jogos Olímpicos', hint: '4 A??? entre cada J???? O????????' },
    { enigma: '3 P por V no F', answer: '3 Pontos por Vitória no Futebol', hint: '3 P????? por V?????? no F??????' },
    { enigma: '1 P por E no F', answer: '1 Ponto por Empate no Futebol', hint: '1 P???? por E????? no F??????' },
    { enigma: '10 na C do P', answer: '10 na Camisa do Pelé', hint: '10 na C????? do P???' },
    { enigma: '5 J em quadra no B', answer: '5 Jogadores em quadra no Basquete', hint: '5 J???????? em quadra no B???????' },
    { enigma: '6 J em quadra no V', answer: '6 Jogadores em quadra no Vôlei', hint: '6 J???????? em quadra no V????' },
    { enigma: '100 M R na O', answer: '100 Metros Rasos na Olimpíada', hint: '100 M????? R???? na O????????' },
    { enigma: '42 K em uma M', answer: '42 Quilômetros em uma Maratona', hint: '42 Q?????????? em uma M???????' },
    { enigma: '15 M de I no F', answer: '15 Minutos de Intervalo no Futebol', hint: '15 M?????? de I???????? no F??????' },
    { enigma: '2 C no F: A e V', answer: '2 Cartões no Futebol: Amarelo e Vermelho', hint: '2 C?????? no F??????: A?????? e V???????' },
    { enigma: '12 R em uma L de B', answer: '12 Rounds em uma Luta de Boxe', hint: '12 R????? em uma L??? de B???' },
    { enigma: '3 T do S no M de C', answer: '3 Títulos do São Paulo no Mundial de Clubes', hint: '3 T?????? do S?? P???? no M?????? de C?????' },
    { enigma: '11 M de D na P de P', answer: '11 Metros de Distância na Marca do Pênalti', hint: '11 M????? de D???????? na M???? do P??????' },
    { enigma: '5 A no S O', answer: '5 Anéis no Símbolo Olímpico', hint: '5 A???? no S?????? O????????' },
    { enigma: '18 B em um C de G', answer: '18 Buracos em um Campo de Golfe', hint: '18 B?????? em um C???? de G????' }
  ],
  'Cinema, Música e Séries': [
    { enigma: '007 A S', answer: '007 Agente Secreto', hint: '007 A????? S??????' },
    { enigma: '101 D', answer: '101 Dálmatas', hint: '101 D???????' },
    { enigma: '3 P', answer: '3 Porquinhos', hint: '3 P?????????' },
    { enigma: '7 A da B de N', answer: '7 Anões da Branca de Neve', hint: '7 A???? da B????? de N???' },
    { enigma: '4 Q F', answer: '4 Quarteto Fantástico', hint: '4 Q??????? F?????????' },
    { enigma: '8 O P', answer: '8 Oitavo Passageiro', hint: '8 O????? P?????????' },
    { enigma: '50 T de C', answer: '50 Tons de Cinza', hint: '50 T??? de C????' },
    { enigma: '3 H e 1 B', answer: '3 Homens e 1 Bebê', hint: '3 H????? e 1 B???' },
    { enigma: '12 H e Outro S', answer: '12 Homens e Outro Segredo', hint: '12 H????? e O???? S??????' },
    { enigma: '300 de E', answer: '300 de Esparta', hint: '300 de E??????' },
    { enigma: '7 M de R aos M', answer: '7 Minutos de Recado aos Mortos', hint: '7 M?????? de R????? aos M?????' },
    { enigma: '4 B de L', answer: '4 Beatles de Liverpool', hint: '4 B?????? de L????????' },
    { enigma: '6 A em F', answer: '6 Amigos em Friends', hint: '6 A????? em F??????' },
    { enigma: '9 C na F do A', answer: '9 Companheiros na Sociedade do Anel', hint: '9 C??????????? na S???????? do A???' },
    { enigma: '2 Torres no S dos A', answer: '2 Torres no Senhor dos Anéis', hint: '2 T????? no S????? dos A????' },
    { enigma: '7 R de W em G of T', answer: '7 Reinos de Westeros em Game of Thrones', hint: '7 R????? de W??????? em G??? of T??????' },
    { enigma: '12 D de V na G', answer: '12 Dias de Viagem na Galáxia', hint: '12 D??? de V????? na G??????' },
    { enigma: '5 T de B B', answer: '5 Temporadas de Breaking Bad', hint: '5 T????????? de B??????? B??' },
    { enigma: '8 O O da M', answer: '8 Os Oito Odiados da Montanha', hint: '8 os O??? O?????? da M???????' },
    { enigma: '4 T do C de F', answer: '4 Torres do Castelo de Fantasia', hint: '4 T????? do C?????? de F???????' }
  ],
  'Geografia e História': [
    { enigma: '7 M do M', answer: '7 Maravilhas do Mundo', hint: '7 M????????? do M????' },
    { enigma: '5 C do M', answer: '5 Continentes do Mundo', hint: '5 C?????????? do M????' },
    { enigma: '26 E e 1 DF no B', answer: '26 Estados e 1 Distrito Federal no Brasil', hint: '26 E?????? e 1 D??????? F?????? no B?????' },
    { enigma: '195 P no M', answer: '195 Países no Mundo', hint: '195 P????? no M????' },
    { enigma: '24 F H no M', answer: '24 Fusos Horários no Mundo', hint: '24 F???? H??????? no M????' },
    { enigma: '7 M no M', answer: '7 Mares no Mundo', hint: '7 M???? no M????' },
    { enigma: '1500 A do D do B', answer: '1500 Ano do Descobrimento do Brasil', hint: '1500 A?? do D???????????? do B?????' },
    { enigma: '1822 A da I do B', answer: '1822 Ano da Independência do Brasil', hint: '1822 A?? da I???????????? do B?????' },
    { enigma: '1889 A da P da R no B', answer: '1889 Ano da Proclamação da República no Brasil', hint: '1889 A?? da P?????????? da R???????? no B?????' },
    { enigma: '2 G M no S XX', answer: '2 Guerras Mundiais no Século XX', hint: '2 G?????? M??????? no S????? XX' },
    { enigma: '1914 a 1918 P G M', answer: '1914 a 1918 Primeira Guerra Mundial', hint: '1914 a 1918 P??????? G????? M??????' },
    { enigma: '1939 a 1945 S G M', answer: '1939 a 1945 Segunda Guerra Mundial', hint: '1939 a 1945 S?????? G????? M??????' },
    { enigma: '1969 A do H na L', answer: '1969 Ano do Homem na Lua', hint: '1969 A?? do H???? na L??' },
    { enigma: '10 M de D', answer: '10 Mandamentos de Deus', hint: '10 M?????????? de D???' },
    { enigma: '12 A de J', answer: '12 Apóstolos de Jesus', hint: '12 A???????? de J????' },
    { enigma: '3 R M na N', answer: '3 Reis Magos no Natal', hint: '3 R??? M???? no N????' },
    { enigma: '1 P C no B de B', answer: '1 Primeiro Colégio no Bairro de Belém', hint: '1 P??????? C?????? no B????? de B????' },
    { enigma: '4 P C: N, S, L e O', answer: '4 Pontos Cardeais: Norte, Sul, Leste e Oeste', hint: '4 P????? C???????: N????, S??, L???? e O????' },
    { enigma: '2 P da T: N e S', answer: '2 Polos da Terra: Norte e Sul', hint: '2 P???? da T????: N???? e S??' },
    { enigma: '1 L do E que divide a T', answer: '1 Linha do Equador que divide a Terra', hint: '1 L???? do E?????? que divide a T????' }
  ]
};

// Gera 20 Ditloids para a rodada com garantia de não repetição dentro do campeonato
export async function generate20Ditloids(
  theme: string,
  excludeQuestions: { enigma: string; answer: string }[] = []
): Promise<DitloidItem[]> {
  // Conjunto de normalização para evitar repetições (mesmo que com pequenas variações de pontuação/maiúsculas)
  const excludedAnswersSet = new Set(excludeQuestions.map(q => normalizeText(q.answer)));
  const excludedEnigmasSet = new Set(excludeQuestions.map(q => normalizeText(q.enigma)));

  const isExcluded = (enigma: string, answer: string): boolean => {
    const normAns = normalizeText(answer);
    const normEni = normalizeText(enigma);
    return excludedAnswersSet.has(normAns) || excludedEnigmasSet.has(normEni);
  };

  // Detecção inteligente de chave (suporta OpenAI sk-... e Gemini AIza... / AQ....)
  let rawOpenAi = (process.env.OPENAI_API_KEY || '').trim();
  let rawGemini = (process.env.GEMINI_API_KEY || '').trim();

  if (rawOpenAi.startsWith('AQ.') || rawOpenAi.startsWith('AIza')) {
    rawGemini = rawOpenAi;
    rawOpenAi = '';
  }

  // Monta lista de exclusão textual para orientar a IA
  const exclusionText = excludeQuestions.length > 0
    ? `\n\nATENÇÃO - REGRA CRÍTICA DE DEDUPLICAÇÃO:
Neste campeonato, os seguintes enigmas e respostas JÁ FORAM UTILIZADOS em outras rodadas. É ESTRITAMENTE PROIBIDO repetir qualquer um deles ou suas respostas:
${excludeQuestions.slice(-35).map(q => `- Enigma: "${q.enigma}" | Resposta: "${q.answer}"`).join('\n')}`
    : '';

  // 1. Tentar IA Gemini se houver chave configurada (Gera enigmas 100% inéditos para o tema)
  if (rawGemini) {
    try {
      const prompt = `Gere exatamente 20 enigmas do tipo DITLOID em Língua Portuguesa sobre o tema "${theme}".
Um Ditloid é uma frase conhecida ou fato onde os números permanecem e as palavras principais viram suas iniciais maiúsculas.
Exemplo: "7 D na S" -> "7 Dias na Semana"
Exemplo: "11 J em um T de F" -> "11 Jogadores em um Time de Futebol"
Exemplo: "101 D" -> "101 Dálmatas"${exclusionText}

Responda APENAS em JSON no formato:
[
  { "enigma": "string", "answer": "string" },
  ... (exatamente 20 itens)
]`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${rawGemini}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = JSON.parse(text) as { enigma: string; answer: string }[];
          if (Array.isArray(parsed)) {
            // Filtra rigorosamente qualquer um que coincidir com perguntas já usadas
            const uniqueItems = parsed.filter(item => !isExcluded(item.enigma, item.answer));
            if (uniqueItems.length >= 20) {
              return uniqueItems.slice(0, 20).map(item => ({
                enigma: item.enigma,
                answer: item.answer,
                hint: generatePatternHint(item.answer)
              }));
            }
          }
        }
      }
    } catch (e) {
      console.warn('Erro ao chamar IA Gemini:', e);
    }
  }

  // 2. Tentar OpenAI se configurada
  if (rawOpenAi.startsWith('sk-')) {
    try {
      const prompt = `Gere exatamente 20 enigmas do tipo DITLOID em Língua Portuguesa sobre o tema "${theme}".
Um Ditloid é uma frase conhecida ou fato onde os números permanecem e as palavras principais viram suas iniciais maiúsculas.
Exemplo: "7 D na S" -> "7 Dias na Semana"
Exemplo: "11 J em um T de F" -> "11 Jogadores em um Time de Futebol"${exclusionText}

Responda APENAS em JSON no formato:
{
  "items": [
    { "enigma": "string", "answer": "string" },
    ... (exatamente 20 itens)
  ]
}`;

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${rawOpenAi}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: 'Você é um gerador especialista em enigmas Ditloid em português com verificação de não repetição.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7
        })
      });

      if (res.ok) {
        const json = await res.json();
        const content = json?.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          const list = (parsed.items || parsed) as { enigma: string; answer: string }[];
          if (Array.isArray(list)) {
            const uniqueList = list.filter(item => !isExcluded(item.enigma, item.answer));
            if (uniqueList.length >= 20) {
              return uniqueList.slice(0, 20).map(item => ({
                enigma: item.enigma,
                answer: item.answer,
                hint: generatePatternHint(item.answer)
              }));
            }
          }
        }
      }
    } catch (e) {
      console.warn('Erro ao chamar OpenAI:', e);
    }
  }

  // 3. Fallback Curado (Presets e Pool com filtro total de não repetição)
  const matchedPresetKey = Object.keys(THEME_PRESETS).find(
    k => k.toLowerCase().includes(theme.toLowerCase()) || theme.toLowerCase().includes(k.toLowerCase())
  );

  const availableFromTheme: DitloidItem[] = [];
  if (matchedPresetKey && THEME_PRESETS[matchedPresetKey]) {
    // Filtra para remover qualquer um que já foi usado
    for (const item of THEME_PRESETS[matchedPresetKey]) {
      if (!isExcluded(item.enigma, item.answer)) {
        availableFromTheme.push(item);
      }
    }
  }

  // Embaralha para que nunca venham na mesma ordem
  availableFromTheme.sort(() => 0.5 - Math.random());

  // Se já temos 20 não repetidos no tema, retorna
  if (availableFromTheme.length >= 20) {
    return availableFromTheme.slice(0, 20);
  }

  // Se faltam enigmas para completar 20 sem repetir, busca em outras categorias do banco curado
  const finalPool: DitloidItem[] = [...availableFromTheme];
  const allOtherPresets: DitloidItem[] = [];
  for (const list of Object.values(THEME_PRESETS)) {
    for (const item of list) {
      if (!isExcluded(item.enigma, item.answer) && !finalPool.some(p => p.enigma === item.enigma)) {
        allOtherPresets.push(item);
      }
    }
  }
  allOtherPresets.sort(() => 0.5 - Math.random());

  for (const item of allOtherPresets) {
    if (finalPool.length >= 20) break;
    finalPool.push(item);
  }

  return finalPool.slice(0, 20);
}
