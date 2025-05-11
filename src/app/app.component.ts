import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NlpToolsComponent } from './components/nlp-tools/nlp-tools.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, NlpToolsComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'nlp-app';
}
