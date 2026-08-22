// AI 开发者书单（Amazon 联盟返佣位）
// ---------------------------------------------------------------
// 书目 ISBN 均经 OpenLibrary 核验；封面来自 OpenLibrary Covers（部分会 302
// 跳转到 archive.org，浏览器 <img> 会自动跟随）。
// 链接统一经 templates.js 的 withUtm() 输出：自动追加联盟 tag（见 affiliate.js）
// 与 UTM 来源参数；rel 标记为 sponsored（Google 对联盟链接的要求）。
// 想换书：改 BOOKS 数组即可（isbn13 填 OpenLibrary 上查到的即可，其余自动生成）。
// ---------------------------------------------------------------
export const BOOKS = [
  {
    title: 'Build a Large Language Model (from Scratch)',
    author: 'Sebastian Raschka',
    year: 2024,
    isbn13: '9781633437166',
    zh: '从零亲手实现一个 LLM：分词、注意力机制、预训练到指令微调，理解大模型内部运作的最佳入门。',
    en: 'Implement an LLM step by step: tokenization, attention, pretraining, and fine-tuning.',
  },
  {
    title: 'AI Engineering',
    author: 'Chip Huyen',
    year: 2024,
    isbn13: '9781098166304',
    zh: 'LLM 应用工程实战：评估、RAG、Agent 与推理优化，写给用好模型 API 的开发者。',
    en: 'Building applications with foundation models: evaluation, RAG, and agents.',
  },
  {
    title: 'Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow',
    author: 'Aurelien Geron',
    year: 2022,
    isbn13: '9781098125974',
    zh: '机器学习公认经典「橙皮书」：从回归到深度学习，理论与实践并重。',
    en: 'The classic hands-on ML guide, from fundamentals to deep learning.',
  },
  {
    title: 'Deep Learning with Python',
    author: 'Francois Chollet',
    year: 2021,
    isbn13: '9781617296864',
    zh: 'Keras 作者亲授深度学习：直觉优先、代码驱动，入门首选。',
    en: 'Deep learning taught by the creator of Keras, intuition first.',
  },
  {
    title: 'Designing Machine Learning Systems',
    author: 'Chip Huyen',
    year: 2022,
    isbn13: '9781098107963',
    zh: 'ML 系统设计方法论：数据管道、特征工程到线上推理，工程视角讲透。',
    en: 'A systematic framework for designing production ML systems.',
  },
  {
    title: 'Natural Language Processing with Transformers',
    author: 'Lewis Tunstall',
    year: 2022,
    isbn13: '9781098136796',
    zh: 'Hugging Face 团队著作：Transformer 架构与开源 NLP 工具链实战。',
    en: 'Transformers in action, from the team behind Hugging Face.',
  },
]

// ISBN-13 -> ISBN-10（图书在 Amazon 的 ASIN 即其 ISBN-10，仅 978 前缀适用）
function isbn10(isbn13) {
  const nine = String(isbn13).replace(/^978/, '').slice(0, 9)
  let sum = 0
  for (let i = 0; i < 9; i++) sum += Number(nine[i]) * (10 - i)
  const check = (11 - (sum % 11)) % 11
  return nine + (check === 10 ? 'X' : String(check))
}

// 生成书单卡片数据（封面 + Amazon 直链 + 双语描述）
export function bookList(lang = 'zh') {
  return BOOKS.map((b) => ({
    title: b.title,
    author: b.author,
    year: b.year,
    desc: lang === 'en' ? b.en : b.zh,
    cover: `https://covers.openlibrary.org/b/isbn/${b.isbn13}-M.jpg?default=false`,
    url: `https://www.amazon.com/dp/${isbn10(b.isbn13)}`,
  }))
}
