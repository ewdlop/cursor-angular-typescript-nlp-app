import { Component } from '@angular/core';
import { TextAnalysisComponent } from './components/text-analysis/text-analysis.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [TextAnalysisComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {}
