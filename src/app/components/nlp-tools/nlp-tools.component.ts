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
import nlp from 'compromise';
import Sentiment from 'sentiment';
import { franc } from 'franc';
import stringSimilarity from 'string-similarity';

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
    MatSelectModule
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

  private sentimentAnalyzer = new Sentiment();
  private readonly categoryKeywords = {
    '技术': ['computer', 'software', 'hardware', 'technology', 'programming', 'code', 'system', 'network', 'data', 'digital'],
    '商业': ['business', 'company', 'market', 'finance', 'money', 'investment', 'trade', 'commerce', 'industry', 'enterprise'],
    '体育': ['sports', 'game', 'team', 'player', 'competition', 'athlete', 'match', 'tournament', 'championship', 'coach'],
    '政治': ['politics', 'government', 'election', 'policy', 'democracy', 'vote', 'campaign', 'party', 'leader', 'policy'],
    '科学': ['science', 'research', 'experiment', 'discovery', 'study', 'theory', 'scientist', 'laboratory', 'analysis', 'method']
  };

  private readonly translations: { [key: string]: { zh: string; en: string } } = {
    'NLP 文本分析工具': { zh: 'NLP 文本分析工具', en: 'NLP Text Analysis Tool' },
    '输入文本': { zh: '输入文本', en: 'Input Text' },
    '请输入要分析的文本...': { zh: '请输入要分析的文本...', en: 'Please enter text to analyze...' },
    '分析文本': { zh: '分析文本', en: 'Analyze Text' },
    '基础统计': { zh: '基础统计', en: 'Basic Statistics' },
    '字符数': { zh: '字符数', en: 'Character Count' },
    '词数': { zh: '词数', en: 'Word Count' },
    '句子数': { zh: '句子数', en: 'Sentence Count' },
    '检测到的语言': { zh: '检测到的语言', en: 'Detected Language' },
    '情感分析': { zh: '情感分析', en: 'Sentiment Analysis' },
    '情感倾向': { zh: '情感倾向', en: 'Sentiment' },
    '情感得分': { zh: '情感得分', en: 'Sentiment Score' },
    '实体识别': { zh: '实体识别', en: 'Entity Recognition' },
    '词性分析': { zh: '词性分析', en: 'Part of Speech Analysis' },
    '动词': { zh: '动词', en: 'Verbs' },
    '形容词': { zh: '形容词', en: 'Adjectives' },
    '名词': { zh: '名词', en: 'Nouns' },
    '关键词': { zh: '关键词', en: 'Keywords' },
    '文本分类': { zh: '文本分类', en: 'Text Classification' },
    '文本相似度': { zh: '文本相似度', en: 'Text Similarity' },
    '比较文本': { zh: '比较文本', en: 'Compare Text' },
    '请输入要比较的文本...': { zh: '请输入要比较的文本...', en: 'Please enter text to compare...' },
    '相似度': { zh: '相似度', en: 'Similarity' },
    '文本摘要': { zh: '文本摘要', en: 'Text Summary' },
    '句子列表': { zh: '句子列表', en: 'Sentence List' },
    '分析结果 JSON': { zh: '分析结果 JSON', en: 'Analysis Results JSON' },
    '复制到剪贴板': { zh: '复制到剪贴板', en: 'Copy to Clipboard' },
    '人物': { zh: '人物', en: 'Person' },
    '地点': { zh: '地点', en: 'Location' },
    '组织': { zh: '组织', en: 'Organization' },
    '非常积极': { zh: '非常积极', en: 'Very Positive' },
    '积极': { zh: '积极', en: 'Positive' },
    '中性': { zh: '中性', en: 'Neutral' },
    '消极': { zh: '消极', en: 'Negative' },
    '非常消极': { zh: '非常消极', en: 'Very Negative' },
    '未知语言': { zh: '未知语言', en: 'Unknown Language' },
    '选择语言': { zh: '选择语言', en: 'Select Language' }
  };

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
    const scores = Object.entries(this.categoryKeywords).map(([category, keywords]) => {
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
    return this.translations[key]?.[this.currentLanguage] || key;
  }
}
