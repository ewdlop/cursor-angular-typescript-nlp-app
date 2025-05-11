import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import nlp from 'compromise';
import Sentiment from 'sentiment';
import { franc } from 'franc';
import stringSimilarity from 'string-similarity';
import { categoryKeywords, translations, commonMistakes } from '../../constants/nlp-constants';

interface Entity {
  type: string;
  text: string;
}

interface CompromiseEntity {
  text: string;
  [key: string]: any;
}

interface Keyword {
  word: string;
  score: number;
}

interface TextCategory {
  category: string;
  score: number;
}

interface TextStats {
  paragraphs: number;
  uniqueWords: number;
  averageWordLength: number;
  averageSentenceLength: number;
  readingTime: number;
  mostCommonWords: { word: string; count: number }[];
}

interface TextFormat {
  type: string;
  content: string;
}

interface TextCluster {
  id: number;
  texts: string[];
  keywords: string[];
  similarity: number;
}

interface TextCorrection {
  original: string;
  corrected: string;
  suggestions: string[];
}

@Component({
  selector: 'app-nlp-tools',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatListModule,
    MatChipsModule,
    MatProgressBarModule,
    MatTabsModule,
    MatDividerModule,
    MatIconModule,
    MatTooltipModule,
    MatSelectModule,
    MatMenuModule,
    MatButtonToggleModule
  ],
  templateUrl: './nlp-tools.component.html',
  styleUrls: ['./nlp-tools.component.scss']
})
export class NlpToolsComponent {
  inputText: string = '';
  wordCount: number = 0;
  characterCount: number = 0;
  sentences: string[] = [];
  sentiment: string = '';
  sentimentScore: number = 0;
  keywords: Keyword[] = [];
  summary: string = '';
  entities: Entity[] = [];
  topics: string[] = [];
  verbs: string[] = [];
  adjectives: string[] = [];
  nouns: string[] = [];
  detectedLanguage: string = '';
  textCategories: TextCategory[] = [];
  similarTexts: { text: string; similarity: number }[] = [];
  comparisonText: string = '';
  jsonOutput: string = '';
  currentLanguage: 'zh' | 'en' = 'zh';
  textStats: TextStats | null = null;
  formattedTexts: TextFormat[] = [];
  exportFormats = ['txt', 'json', 'csv', 'html'];
  textClusters: TextCluster[] = [];
  textCorrections: TextCorrection[] = [];
  multipleTexts: string[] = [];
  currentTextIndex: number = 0;
  summaryLength: 'short' | 'medium' | 'long' = 'medium';

  private sentimentAnalyzer = new Sentiment();

  constructor(private snackBar: MatSnackBar) {}

  analyzeText() {
    if (!this.inputText.trim()) return;

    const doc = nlp(this.inputText);
    
    // 基础统计
    this.characterCount = this.inputText.length;
    this.wordCount = doc.terms().length;
    this.sentences = doc.sentences().out('array');
    
    // 语言检测
    this.detectedLanguage = this.detectLanguage(this.inputText);
    
    // 使用 sentiment 库进行情感分析
    const sentimentResult = this.sentimentAnalyzer.analyze(this.inputText);
    this.sentimentScore = sentimentResult.score;
    this.sentiment = this.getSentimentLabel(sentimentResult.score);
    
    // 使用 compromise 提取实体
    this.entities = [
      ...doc.people().json().map((p: CompromiseEntity) => ({ type: '人物', text: p.text })),
      ...doc.places().json().map((p: CompromiseEntity) => ({ type: '地点', text: p.text })),
      ...doc.organizations().json().map((o: CompromiseEntity) => ({ type: '组织', text: o.text }))
    ];
    
    // 提取词性
    this.verbs = doc.verbs().out('array');
    this.adjectives = doc.adjectives().out('array');
    this.nouns = doc.nouns().out('array');
    
    // 提取主题（使用名词作为主题）
    this.topics = doc.nouns().out('array')
      .filter((word: string, index: number, self: string[]) => self.indexOf(word) === index)
      .slice(0, 5);
    
    // 提取关键词
    this.extractKeywords(doc);
    
    // 文本分类
    this.classifyText(doc);
    
    // 生成摘要
    this.generateSummary(doc);
    
    // 生成 JSON 输出
    this.generateJsonOutput();
    
    // 添加新的分析
    this.analyzeTextStats(doc);
    this.formatText();
  }

  private detectLanguage(text: string): string {
    const langCode = franc(text, { minLength: 3 });
    const languageMap: { [key: string]: string } = {
      'eng': '英语',
      'cmn': '中文',
      'jpn': '日语',
      'kor': '韩语',
      'fra': '法语',
      'deu': '德语',
      'spa': '西班牙语',
      'ita': '意大利语',
      'rus': '俄语'
    };
    return languageMap[langCode] || '未知语言';
  }

  private extractKeywords(doc: any) {
    const terms = doc.terms().json();
    const wordFreq: { [key: string]: number } = {};
    
    terms.forEach((term: any) => {
      const word = term.text.toLowerCase();
      if (word.length > 3) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });
    
    this.keywords = Object.entries(wordFreq)
      .map(([word, freq]) => ({
        word,
        score: freq * (1 + (doc.nouns().match(word).length * 0.5))
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }

  private classifyText(doc: any) {
    const text = this.inputText.toLowerCase();
    const scores = Object.entries(categoryKeywords).map(([category, keywords]) => {
      const score = keywords.reduce((sum, keyword) => {
        return sum + (text.includes(keyword) ? 1 : 0);
      }, 0) / keywords.length;
      return { category, score };
    });

    this.textCategories = scores
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }

  compareTexts() {
    if (!this.comparisonText.trim()) return;

    const similarity = stringSimilarity.compareTwoStrings(
      this.inputText.toLowerCase(),
      this.comparisonText.toLowerCase()
    );

    this.similarTexts = [{
      text: this.comparisonText,
      similarity: similarity
    }];
  }

  private getSentimentLabel(score: number): string {
    if (score > 2) return '非常积极';
    if (score > 0) return '积极';
    if (score === 0) return '中性';
    if (score > -2) return '消极';
    return '非常消极';
  }

  private generateSummary(doc: any) {
    if (this.sentences.length <= 2) {
      this.summary = this.inputText;
      return;
    }
    
    // 使用 compromise 的句子重要性评分
    const sentences = doc.sentences();
    const importantSentences = sentences
      .json()
      .map((s: any, i: number) => ({
        index: i,
        text: s.text,
        score: this.calculateSentenceScore(s.text)
      }))
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 2)
      .sort((a: any, b: any) => a.index - b.index);
    
    this.summary = importantSentences.map((s: any) => s.text).join('. ') + '.';
  }

  private calculateSentenceScore(sentence: string): number {
    const doc = nlp(sentence);
    const score = 
      doc.nouns().length * 2 + // 名词权重更高
      doc.verbs().length +
      doc.adjectives().length;
    return score;
  }

  private generateJsonOutput() {
    const result = {
      basicStats: {
        characterCount: this.characterCount,
        wordCount: this.wordCount,
        sentenceCount: this.sentences.length,
        detectedLanguage: this.detectedLanguage
      },
      sentiment: {
        label: this.sentiment,
        score: this.sentimentScore
      },
      entities: this.entities,
      keywords: this.keywords,
      topics: this.topics,
      posAnalysis: {
        verbs: this.verbs,
        adjectives: this.adjectives,
        nouns: this.nouns
      },
      textCategories: this.textCategories,
      summary: this.summary,
      sentences: this.sentences
    };

    this.jsonOutput = JSON.stringify(result, null, 2);
  }

  copyToClipboard() {
    navigator.clipboard.writeText(this.jsonOutput).then(() => {
      this.snackBar.open('已复制到剪贴板', '关闭', {
        duration: 2000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom'
      });
    });
  }

  getTranslation(key: string): string {
    return translations[key]?.[this.currentLanguage] || key;
  }

  private analyzeTextStats(doc: any) {
    const paragraphs = this.inputText.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
    const words = doc.terms().out('array');
    const uniqueWords = new Set(words.map((w: string) => w.toLowerCase())).size;
    const averageWordLength = words.reduce((sum: number, word: string) => sum + word.length, 0) / words.length;
    const averageSentenceLength = words.length / this.sentences.length;
    const readingTime = Math.ceil(words.length / 200); // 假设阅读速度为每分钟200词

    // 计算最常见词
    const wordCount: { [key: string]: number } = {};
    words.forEach((word: string) => {
      const lowerWord = word.toLowerCase();
      if (lowerWord.length > 3) { // 忽略短词
        wordCount[lowerWord] = (wordCount[lowerWord] || 0) + 1;
      }
    });

    const mostCommonWords = Object.entries(wordCount)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    this.textStats = {
      paragraphs,
      uniqueWords,
      averageWordLength,
      averageSentenceLength,
      readingTime,
      mostCommonWords
    };
  }

  private formatText() {
    this.formattedTexts = [
      { type: 'uppercase', content: this.inputText.toUpperCase() },
      { type: 'lowercase', content: this.inputText.toLowerCase() },
      { type: 'titlecase', content: this.inputText.replace(/\b\w/g, (l: string) => l.toUpperCase()) },
      { type: 'sentencecase', content: this.inputText.replace(/(^\w|\.\s+\w)/g, (l: string) => l.toUpperCase()) }
    ];
  }

  exportText(format: string) {
    try {
      let content = '';
      let filename = 'text-analysis';
      let mimeType = '';

      switch (format) {
        case 'txt':
          content = this.inputText;
          filename += '.txt';
          mimeType = 'text/plain';
          break;
        case 'json':
          content = JSON.stringify({
            text: this.inputText,
            stats: this.textStats,
            analysis: {
              sentiment: this.sentiment,
              sentimentScore: this.sentimentScore,
              entities: this.entities,
              keywords: this.keywords
            }
          }, null, 2);
          filename += '.json';
          mimeType = 'application/json';
          break;
        case 'csv':
          content = 'Type,Value\n';
          content += `Characters,${this.characterCount}\n`;
          content += `Words,${this.wordCount}\n`;
          content += `Sentences,${this.sentences.length}\n`;
          content += `Sentiment Score,${this.sentimentScore}\n`;
          filename += '.csv';
          mimeType = 'text/csv';
          break;
        case 'html':
          content = `
            <html>
              <head>
                <title>Text Analysis</title>
                <style>
                  body { font-family: Arial, sans-serif; margin: 20px; }
                  .section { margin-bottom: 20px; }
                  .stat { margin: 5px 0; }
                </style>
              </head>
              <body>
                <h1>Text Analysis Results</h1>
                <div class="section">
                  <h2>Basic Stats</h2>
                  <div class="stat">Characters: ${this.characterCount}</div>
                  <div class="stat">Words: ${this.wordCount}</div>
                  <div class="stat">Sentences: ${this.sentences.length}</div>
                </div>
                <div class="section">
                  <h2>Sentiment Analysis</h2>
                  <div class="stat">Sentiment: ${this.sentiment}</div>
                  <div class="stat">Score: ${this.sentimentScore}</div>
                </div>
              </body>
            </html>
          `;
          filename += '.html';
          mimeType = 'text/html';
          break;
      }

      const blob = new Blob([content], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);

      this.snackBar.open(this.getTranslation('导出成功'), this.getTranslation('关闭'), {
        duration: 2000
      });
    } catch (error) {
      this.snackBar.open(this.getTranslation('导出失败'), this.getTranslation('关闭'), {
        duration: 2000
      });
    }
  }

  addText() {
    if (this.inputText.trim()) {
      this.multipleTexts.push(this.inputText);
      this.inputText = '';
      this.analyzeMultipleTexts();
    }
  }

  removeText(index: number) {
    this.multipleTexts.splice(index, 1);
    this.analyzeMultipleTexts();
  }

  private analyzeMultipleTexts() {
    if (this.multipleTexts.length < 2) {
      this.textClusters = [];
      return;
    }

    // 计算文本之间的相似度
    const similarities: { [key: string]: number } = {};
    for (let i = 0; i < this.multipleTexts.length; i++) {
      for (let j = i + 1; j < this.multipleTexts.length; j++) {
        const similarity = stringSimilarity.compareTwoStrings(
          this.multipleTexts[i],
          this.multipleTexts[j]
        );
        similarities[`${i}-${j}`] = similarity;
      }
    }

    // 使用简单的聚类算法
    const clusters: TextCluster[] = [];
    const processed = new Set<number>();

    for (let i = 0; i < this.multipleTexts.length; i++) {
      if (processed.has(i)) continue;

      const cluster: TextCluster = {
        id: clusters.length,
        texts: [this.multipleTexts[i]],
        keywords: this.extractKeywordsFromText(this.multipleTexts[i]),
        similarity: 0
      };

      for (let j = i + 1; j < this.multipleTexts.length; j++) {
        if (processed.has(j)) continue;

        const similarity = similarities[`${i}-${j}`];
        if (similarity > 0.5) { // 相似度阈值
          cluster.texts.push(this.multipleTexts[j]);
          processed.add(j);
          cluster.similarity = Math.max(cluster.similarity, similarity);
        }
      }

      if (cluster.texts.length > 1) {
        clusters.push(cluster);
      }
      processed.add(i);
    }

    this.textClusters = clusters;
  }

  private extractKeywordsFromText(text: string): string[] {
    const doc = nlp(text);
    const terms = doc.terms().json();
    const wordFreq: { [key: string]: number } = {};
    
    terms.forEach((term: any) => {
      const word = term.text.toLowerCase();
      if (word.length > 3) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });
    
    return Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  }

  correctText() {
    if (!this.inputText.trim()) return;

    const doc = nlp(this.inputText);
    const corrections: TextCorrection[] = [];

    // 检查常见错误
    const sentences = doc.sentences().json();
    sentences.forEach((sentence: any) => {
      const words = sentence.terms;
      words.forEach((word: any) => {
        if (word.text.length > 2) {
          const suggestions = this.getSpellingSuggestions(word.text);
          if (suggestions.length > 0) {
            corrections.push({
              original: word.text,
              corrected: suggestions[0],
              suggestions
            });
          }
        }
      });
    });

    this.textCorrections = corrections;
    
    if (corrections.length === 0) {
      this.snackBar.open(this.getTranslation('未发现错误'), this.getTranslation('关闭'), {
        duration: 2000
      });
    }
  }

  private getSpellingSuggestions(word: string): string[] {
    return commonMistakes[word.toLowerCase()] || [];
  }

  applyCorrection(correction: TextCorrection) {
    this.inputText = this.inputText.replace(
      new RegExp(correction.original, 'g'),
      correction.corrected
    );
    this.analyzeText();
  }

  generateEnhancedSummary(length: 'short' | 'medium' | 'long' = 'medium') {
    if (!this.inputText.trim()) return;

    const doc = nlp(this.inputText);
    const sentences = doc.sentences().json();
    
    interface ScoredSentence {
      index: number;
      text: string;
      score: number;
    }
    
    // 计算句子重要性分数
    const scoredSentences = sentences.map((sentence: { text: string }, index: number): ScoredSentence => {
      const score = this.calculateEnhancedSentenceScore(sentence.text);
      return { index, text: sentence.text, score };
    });

    // 根据长度选择句子数量
    const sentenceCount = length === 'short' ? 1 : length === 'medium' ? 2 : 3;
    
    // 选择得分最高的句子
    const selectedSentences = scoredSentences
      .sort((a: ScoredSentence, b: ScoredSentence) => b.score - a.score)
      .slice(0, sentenceCount)
      .sort((a: ScoredSentence, b: ScoredSentence) => a.index - b.index);

    this.summary = selectedSentences.map((s: ScoredSentence) => s.text).join('. ') + '.';
  }

  private calculateEnhancedSentenceScore(sentence: string): number {
    const doc = nlp(sentence);
    let score = 0;

    // 名词权重
    score += doc.nouns().length * 2;
    
    // 动词权重
    score += doc.verbs().length;
    
    // 形容词权重
    score += doc.adjectives().length;
    
    // 句子位置权重（首尾句子更重要）
    if (this.sentences.indexOf(sentence) === 0 || 
        this.sentences.indexOf(sentence) === this.sentences.length - 1) {
      score += 2;
    }
    
    // 句子长度权重（中等长度的句子更好）
    const length = sentence.length;
    if (length > 50 && length < 150) {
      score += 1;
    }

    return score;
  }
}
