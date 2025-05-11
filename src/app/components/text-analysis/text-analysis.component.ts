import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { NlpService } from '../../services/nlp.service';

@Component({
  selector: 'app-text-analysis',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatListModule
  ],
  templateUrl: './text-analysis.component.html',
  styleUrls: ['./text-analysis.component.scss']
})
export class TextAnalysisComponent {
  inputText: string = '';
  wordCount: number = 0;
  characterCount: number = 0;
  sentenceCount: number = 0;
  commonWords: { word: string; count: number }[] = [];

  constructor(private nlpService: NlpService) {}

  analyzeText() {
    if (!this.inputText.trim()) return;

    this.wordCount = this.nlpService.countWords(this.inputText);
    this.characterCount = this.nlpService.countCharacters(this.inputText);
    this.sentenceCount = this.nlpService.countSentences(this.inputText);
    this.commonWords = this.nlpService.getMostCommonWords(this.inputText);
  }
}
