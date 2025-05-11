import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NlpService {

  constructor() { }

  // 计算文本中的单词数
  countWords(text: string): number {
    return text.trim().split(/\s+/).length;
  }

  // 计算文本中的字符数
  countCharacters(text: string): number {
    return text.length;
  }

  // 计算文本中的句子数
  countSentences(text: string): number {
    return text.split(/[.!?]+/).filter(Boolean).length;
  }

  // 获取文本中最常见的单词
  getMostCommonWords(text: string, limit: number = 5): { word: string; count: number }[] {
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const wordCount = words.reduce((acc: { [key: string]: number }, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(wordCount)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }
}
