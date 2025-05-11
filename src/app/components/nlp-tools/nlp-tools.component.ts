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
    '选择语言': { zh: '选择语言', en: 'Select Language' },
    '段落数': { zh: '段落数', en: 'Paragraphs' },
    '唯一词数': { zh: '唯一词数', en: 'Unique Words' },
    '平均词长': { zh: '平均词长', en: 'Average Word Length' },
    '平均句长': { zh: '平均句长', en: 'Average Sentence Length' },
    '阅读时间': { zh: '阅读时间', en: 'Reading Time' },
    '最常见词': { zh: '最常见词', en: 'Most Common Words' },
    '文本格式化': { zh: '文本格式化', en: 'Text Formatting' },
    '大写': { zh: '大写', en: 'UPPERCASE' },
    '小写': { zh: '小写', en: 'lowercase' },
    '首字母大写': { zh: '首字母大写', en: 'Title Case' },
    '句子格式': { zh: '句子格式', en: 'Sentence Case' },
    '导出文本': { zh: '导出文本', en: 'Export Text' },
    '导出为': { zh: '导出为', en: 'Export as' },
    '导出成功': { zh: '导出成功', en: 'Export successful' },
    '导出失败': { zh: '导出失败', en: 'Export failed' },
    '分钟': { zh: '分钟', en: 'minutes' },
    '字符': { zh: '字符', en: 'characters' },
    '文本聚类': { zh: '文本聚类', en: 'Text Clustering' },
    '添加文本': { zh: '添加文本', en: 'Add Text' },
    '删除文本': { zh: '删除文本', en: 'Remove Text' },
    '聚类结果': { zh: '聚类结果', en: 'Clustering Results' },
    '文本纠错': { zh: '文本纠错', en: 'Text Correction' },
    '原始文本': { zh: '原始文本', en: 'Original Text' },
    '修正建议': { zh: '修正建议', en: 'Correction Suggestions' },
    '应用修正': { zh: '应用修正', en: 'Apply Correction' },
    '摘要长度': { zh: '摘要长度', en: 'Summary Length' },
    '短': { zh: '短', en: 'Short' },
    '中': { zh: '中', en: 'Medium' },
    '长': { zh: '长', en: 'Long' },
    '检查文本': { zh: '检查文本', en: 'Check Text' },
    '已添加的文本': { zh: '已添加的文本', en: 'Added Texts' },
    '聚类': { zh: '聚类', en: 'Cluster' },
    '未发现错误': { zh: '未发现错误', en: 'No errors found' }
  };

  private readonly commonMistakes: { [key: string]: string[] } = {
    'teh': ['the'],
    'recieve': ['receive'],
    'seperate': ['separate'],
    'accomodate': ['accommodate'],
    'occured': ['occurred'],
    'alot': ['a lot'],
    'definately': ['definitely'],
    'existance': ['existence'],
    'independant': ['independent'],
    'persistant': ['persistent'],
    'refered': ['referred'],
    'truely': ['truly'],
    'untill': ['until'],
    'wierd': ['weird'],
    'writting': ['writing'],
    'abscence': ['absence'],
    'accomodation': ['accommodation'],
    'acheive': ['achieve'],
    'adress': ['address'],
    'agressive': ['aggressive'],
    'allways': ['always'],
    'amature': ['amateur'],
    'aparent': ['apparent'],
    'apreciate': ['appreciate'],
    'aquire': ['acquire'],
    'arguement': ['argument'],
    'assasination': ['assassination'],
    'basicly': ['basically'],
    'begining': ['beginning'],
    'beleive': ['believe'],
    'benifit': ['benefit'],
    'buisness': ['business'],
    'calender': ['calendar'],
    'carrer': ['career'],
    'cemetary': ['cemetery'],
    'challange': ['challenge'],
    'collegue': ['colleague'],
    'comming': ['coming'],
    'commitee': ['committee'],
    'completly': ['completely'],
    'concious': ['conscious'],
    'consistant': ['consistent'],
    'curiousity': ['curiosity'],
    'decaffinated': ['decaffeinated'],
    'decathalon': ['decathlon'],
    'desireable': ['desirable'],
    'diety': ['deity'],
    'dilemna': ['dilemma'],
    'dissapoint': ['disappoint'],
    'divorce': ['divorce'],
    'drunkeness': ['drunkenness'],
    'dumbbell': ['dumbbell'],
    'embarass': ['embarrass'],
    'enviroment': ['environment'],
    'excellence': ['excellence'],
    'experiance': ['experience'],
    'extreme': ['extreme'],
    'facist': ['fascist'],
    'familys': ['families'],
    'fascinate': ['fascinate'],
    'febuary': ['february'],
    'flourescent': ['fluorescent'],
    'foriegn': ['foreign'],
    'forseeable': ['foreseeable'],
    'fourty': ['forty'],
    'freind': ['friend'],
    'further': ['further'],
    'gauge': ['gauge'],
    'glamour': ['glamour'],
    'goverment': ['government'],
    'grammer': ['grammar'],
    'gratefull': ['grateful'],
    'guage': ['gauge'],
    'harrass': ['harass'],
    'hemorage': ['hemorrhage'],
    'heros': ['heroes'],
    'hieght': ['height'],
    'hygenic': ['hygienic'],
    'hypocrasy': ['hypocrisy'],
    'indispensible': ['indispensable'],
    'inoculate': ['inoculate'],
    'inteligence': ['intelligence'],
    'intresting': ['interesting'],
    'irresistable': ['irresistible'],
    'knowlege': ['knowledge'],
    'lazer': ['laser'],
    'libary': ['library'],
    'lightening': ['lightning'],
    'loose': ['lose'],
    'lose': ['lose'],
    'maintainance': ['maintenance'],
    'managable': ['manageable'],
    'midevil': ['medieval'],
    'millenium': ['millennium'],
    'miniture': ['miniature'],
    'mischeivous': ['mischievous'],
    'mispell': ['misspell'],
    'missle': ['missile'],
    'mitigate': ['mitigate'],
    'monestary': ['monastery'],
    'monkies': ['monkeys'],
    'morgage': ['mortgage'],
    'mountian': ['mountain'],
    'moustache': ['moustache'],
    'neccessary': ['necessary'],
    'neice': ['niece'],
    'nickle': ['nickel'],
    'nineth': ['ninth'],
    'ninty': ['ninety'],
    'noone': ['no one'],
    'noticable': ['noticeable'],
    'occurence': ['occurrence'],
    'oppurtunity': ['opportunity'],
    'paralell': ['parallel'],
    'parliment': ['parliament'],
    'pasttime': ['pastime'],
    'pavillion': ['pavilion'],
    'peice': ['piece'],
    'percieve': ['perceive'],
    'perseverence': ['perseverance'],
    'personel': ['personnel'],
    'playright': ['playwright'],
    'pleasent': ['pleasant'],
    'politican': ['politician'],
    'pollitician': ['politician'],
    'posession': ['possession'],
    'prefered': ['preferred'],
    'prefering': ['preferring'],
    'presance': ['presence'],
    'priviledge': ['privilege'],
    'proffesional': ['professional'],
    'promiss': ['promise'],
    'pronounciation': ['pronunciation'],
    'prophecy': ['prophecy'],
    'prophesy': ['prophesy'],
    'psycology': ['psychology'],
    'publically': ['publicly'],
    'quanity': ['quantity'],
    'quarentine': ['quarantine'],
    'questionaire': ['questionnaire'],
    'readible': ['readable'],
    'realy': ['really'],
    'reccomend': ['recommend'],
    'reccuring': ['recurring'],
    'reconize': ['recognize'],
    'refering': ['referring'],
    'relevent': ['relevant'],
    'religous': ['religious'],
    'repitition': ['repetition'],
    'restarant': ['restaurant'],
    'rythm': ['rhythm'],
    'rythym': ['rhythm'],
    'sacreligious': ['sacrilegious'],
    'sacrifical': ['sacrificial'],
    'saftey': ['safety'],
    'salery': ['salary'],
    'sanctionning': ['sanctioning'],
    'satelite': ['satellite'],
    'satelites': ['satellites'],
    'satisfactority': ['satisfactorily'],
    'scissors': ['scissors'],
    'scoll': ['scroll'],
    'seige': ['siege'],
    'seriousness': ['seriousness'],
    'severe': ['severe'],
    'severly': ['severely'],
    'shamen': ['shaman'],
    'sheat': ['sheath'],
    'sherif': ['sheriff'],
    'shineing': ['shining'],
    'shiped': ['shipped'],
    'shoping': ['shopping'],
    'sieze': ['seize'],
    'siezing': ['seizing'],
    'similiar': ['similar'],
    'simplier': ['simpler'],
    'sincerly': ['sincerely'],
    'skilfull': ['skilful'],
    'sophmore': ['sophomore'],
    'sophmoric': ['sophomoric'],
    'specificaly': ['specifically'],
    'specifing': ['specifying'],
    'speach': ['speech'],
    'sponser': ['sponsor'],
    'spontaneous': ['spontaneous'],
    'spontanous': ['spontaneous'],
    'stange': ['strange'],
    'startegic': ['strategic'],
    'startegy': ['strategy'],
    'stingy': ['stingy'],
    'stiring': ['stirring'],
    'stong': ['strong'],
    'stopage': ['stoppage'],
    'storise': ['stories'],
    'stornegst': ['strongest'],
    'stragedy': ['strategy'],
    'stragler': ['straggler'],
    'strech': ['stretch'],
    'strikely': ['strikingly'],
    'stubborness': ['stubbornness'],
    'stucture': ['structure'],
    'stumach': ['stomach'],
    'succesful': ['successful'],
    'succesfully': ['successfully'],
    'succesion': ['succession'],
    'succesive': ['successive'],
    'succint': ['succinct'],
    'sufficent': ['sufficient'],
    'sufficently': ['sufficiently'],
    'sumary': ['summary'],
    'supercede': ['supersede'],
    'superintendant': ['superintendent'],
    'suprise': ['surprise'],
    'suprised': ['surprised'],
    'suprising': ['surprising'],
    'suprisingly': ['surprisingly'],
    'suround': ['surround'],
    'surounds': ['surrounds'],
    'surveilence': ['surveillance'],
    'surviver': ['survivor'],
    'susceptability': ['susceptibility'],
    'susceptable': ['susceptible'],
    'suspention': ['suspension'],
    'swaer': ['swear'],
    'swaers': ['swears'],
    'swepth': ['swept'],
    'symetrical': ['symmetrical'],
    'symetry': ['symmetry'],
    'sympothize': ['sympathize'],
    'synagouge': ['synagogue'],
    'syncronization': ['synchronization'],
    'synonomous': ['synonymous'],
    'synonymns': ['synonyms'],
    'syphyllis': ['syphilis'],
    'sypmtoms': ['symptoms'],
    'syrap': ['syrup'],
    'systematicaly': ['systematically'],
    'sytem': ['system'],
    'sytematic': ['systematic'],
    'tabacco': ['tobacco'],
    'tath': ['that'],
    'tattooes': ['tattoos'],
    'taxanomic': ['taxonomic'],
    'techician': ['technician'],
    'techicians': ['technicians'],
    'techology': ['technology'],
    'tehy': ['they'],
    'temperarily': ['temporarily'],
    'temperment': ['temperament'],
    'tempertaure': ['temperature'],
    'temperture': ['temperature'],
    'tendancy': ['tendency'],
    'tendonitis': ['tendinitis'],
    'tennisplayer': ['tennis player'],
    'tepmorarily': ['temporarily'],
    'terrestial': ['terrestrial'],
    'terriories': ['territories'],
    'territorist': ['terrorist'],
    'territory': ['territory'],
    'testiclular': ['testicular'],
    'tghe': ['the'],
    'thier': ['their'],
    'thign': ['thing'],
    'thigns': ['things'],
    'thikning': ['thinking'],
    'thikn': ['think'],
    'thiunk': ['think'],
    'thn': ['then'],
    'thna': ['than'],
    'thne': ['then'],
    'thnig': ['thing'],
    'thnigs': ['things'],
    'thoughout': ['throughout'],
    'threatend': ['threatened'],
    'threatning': ['threatening'],
    'threee': ['three'],
    'threshhold': ['threshold'],
    'thrid': ['third'],
    'throrough': ['thorough'],
    'throughly': ['thoroughly'],
    'throught': ['through'],
    'througout': ['throughout'],
    'thru': ['through'],
    'thsi': ['this'],
    'thsoe': ['those'],
    'thta': ['that'],
    'thyat': ['that'],
    'tiem': ['time'],
    'tihkn': ['think'],
    'tihs': ['this'],
    'timne': ['time'],
    'tiome': ['time'],
    'tje': ['the'],
    'tjhe': ['the'],
    'tjpanishad': ['upanishad'],
    'tkae': ['take'],
    'tkaes': ['takes'],
    'tkaing': ['taking'],
    'tlaking': ['talking'],
    'tobbaco': ['tobacco'],
    'todays': ['today\'s'],
    'todya': ['today'],
    'togehter': ['together'],
    'toldt': ['told'],
    'tollerant': ['tolerant'],
    'tomatos': ['tomatoes'],
    'tommorow': ['tomorrow'],
    'tommorrow': ['tomorrow'],
    'tongiht': ['tonight'],
    'toriodal': ['toroidal'],
    'tormenters': ['tormentors'],
    'tornadoe': ['tornado'],
    'torpeados': ['torpedoes'],
    'torpedos': ['torpedoes'],
    'tortise': ['tortoise'],
    'tothe': ['to the'],
    'toubles': ['troubles'],
    'tounge': ['tongue'],
    'tourch': ['torch'],
    'towords': ['towards'],
    'towrad': ['toward'],
    'tradionally': ['traditionally'],
    'traditionaly': ['traditionally'],
    'traditionnal': ['traditional'],
    'traditition': ['tradition'],
    'tradtionally': ['traditionally'],
    'trancendent': ['transcendent'],
    'trancending': ['transcending'],
    'tranform': ['transform'],
    'tranformed': ['transformed'],
    'transcendant': ['transcendent'],
    'transcendentational': ['transcendental'],
    'transend': ['transcend'],
    'transending': ['transcending'],
    'transexual': ['transsexual'],
    'transfered': ['transferred'],
    'transfering': ['transferring'],
    'transforation': ['transformation'],
    'transistion': ['transition'],
    'translater': ['translator'],
    'translaters': ['translators'],
    'transmissable': ['transmissible'],
    'transporation': ['transportation'],
    'tremelo': ['tremolo'],
    'tremelos': ['tremolos'],
    'triguered': ['triggered'],
    'triology': ['trilogy'],
    'troling': ['trolling'],
    'troup': ['troupe'],
    'trustworthyness': ['trustworthiness'],
    'turnk': ['trunk'],
    'tust': ['trust'],
    'twon': ['town'],
    'twpo': ['two'],
    'tyhat': ['that'],
    'tyhe': ['the'],
    'typcial': ['typical'],
    'typicaly': ['typically'],
    'tyranies': ['tyrannies'],
    'tyrany': ['tyranny'],
    'tyrranies': ['tyrannies'],
    'tyrrany': ['tyranny'],
    'ubiquitious': ['ubiquitous'],
    'ubiquitous': ['ubiquitous'],
    'ukranian': ['ukrainian'],
    'ultimely': ['ultimately'],
    'unacompanied': ['unaccompanied'],
    'unahppy': ['unhappy'],
    'unanymous': ['unanimous'],
    'unathorised': ['unauthorised'],
    'unavailible': ['unavailable'],
    'unballance': ['unbalance'],
    'unbeleivable': ['unbelievable'],
    'uncertainity': ['uncertainty'],
    'unchallengable': ['unchallengeable'],
    'unchangable': ['unchangeable'],
    'uncompetive': ['uncompetitive'],
    'unconcious': ['unconscious'],
    'unconciousness': ['unconsciousness'],
    'unconfortability': ['discomfort'],
    'uncontitutional': ['unconstitutional'],
    'unconvential': ['unconventional'],
    'undecideable': ['undecidable'],
    'undesireable': ['undesirable'],
    'undetecable': ['undetectable'],
    'undoubtably': ['undoubtedly'],
    'undreground': ['underground'],
    'uneccesary': ['unnecessary'],
    'unecessary': ['unnecessary'],
    'unequalities': ['inequalities'],
    'unforseen': ['unforeseen'],
    'unforunate': ['unfortunate'],
    'unforunately': ['unfortunately'],
    'unfourtunately': ['unfortunately'],
    'unihabited': ['uninhabited'],
    'unilateraly': ['unilaterally'],
    'unilatreal': ['unilateral'],
    'unilatreally': ['unilaterally'],
    'uninterruped': ['uninterrupted'],
    'uninterupted': ['uninterrupted'],
    'unitedstates': ['United States'],
    'unitesstates': ['United States'],
    'universaly': ['universally'],
    'unlikly': ['unlikely'],
    'unmistakeably': ['unmistakably'],
    'unneccesarily': ['unnecessarily'],
    'unneccesary': ['unnecessary'],
    'unneccessarily': ['unnecessarily'],
    'unneccessary': ['unnecessary'],
    'unnecesarily': ['unnecessarily'],
    'unnecesary': ['unnecessary'],
    'unoffical': ['unofficial'],
    'unoticeable': ['unnoticeable'],
    'unplease': ['displease'],
    'unplesant': ['unpleasant'],
    'unprecendented': ['unprecedented'],
    'unprecidented': ['unprecedented'],
    'unrepentent': ['unrepentant'],
    'unrepetant': ['unrepentant'],
    'unrepetent': ['unrepentant'],
    'unsed': ['used'],
    'unsuccesful': ['unsuccessful'],
    'unsuccesfully': ['unsuccessfully'],
    'unsuccessfull': ['unsuccessful'],
    'unsucesful': ['unsuccessful'],
    'unsucesfuly': ['unsuccessfully'],
    'unsucessful': ['unsuccessful'],
    'unsucessfully': ['unsuccessfully'],
    'unsuprised': ['unsurprised'],
    'unsuprsing': ['unsurprising'],
    'unsuprized': ['unsurprised'],
    'unsuprizing': ['unsurprising'],
    'unsurprized': ['unsurprised'],
    'unsurprizing': ['unsurprising'],
    'untranslateable': ['untranslatable'],
    'unuseable': ['unusable'],
    'unusuable': ['unusable'],
    'unviersity': ['university'],
    'unwarrented': ['unwarranted'],
    'unweildly': ['unwieldy'],
    'unwieldly': ['unwieldy'],
    'upcomming': ['upcoming'],
    'useage': ['usage'],
    'usefull': ['useful'],
    'usefuly': ['usefully'],
    'useing': ['using'],
    'usualy': ['usually'],
    'ususally': ['usually'],
    'vaccum': ['vacuum'],
    'vaccume': ['vacuum'],
    'vacinity': ['vicinity'],
    'vaguaries': ['vagaries'],
    'vaieties': ['varieties'],
    'vailidty': ['validity'],
    'valetta': ['valletta'],
    'valuble': ['valuable'],
    'valueable': ['valuable'],
    'varations': ['variations'],
    'varient': ['variant'],
    'varing': ['varying'],
    'varity': ['variety'],
    'vasall': ['vassal'],
    'vasalls': ['vassals'],
    'vegatarian': ['vegetarian'],
    'vegitables': ['vegetables'],
    'vegtable': ['vegetable'],
    'vehicule': ['vehicle'],
    'vengance': ['vengeance'],
    'vengence': ['vengeance'],
    'verfication': ['verification'],
    'verison': ['version'],
    'verisons': ['versions'],
    'vermillion': ['vermilion'],
    'versitilaty': ['versatility'],
    'versitlity': ['versatility'],
    'vetween': ['between'],
    'veyr': ['very'],
    'vidoe': ['video'],
    'vigilence': ['vigilance'],
    'vigourous': ['vigorous'],
    'villian': ['villain'],
    'villification': ['vilification'],
    'villify': ['vilify'],
    'vincinity': ['vicinity'],
    'virtualy': ['virtually'],
    'visable': ['visible'],
    'visably': ['visibly'],
    'visting': ['visiting'],
    'vistors': ['visitors'],
    'vitories': ['victories'],
    'volcanoe': ['volcano'],
    'voleyball': ['volleyball'],
    'volontary': ['voluntary'],
    'volonteer': ['volunteer'],
    'volonteered': ['volunteered'],
    'volonteering': ['volunteering'],
    'volonteers': ['volunteers'],
    'volounteer': ['volunteer'],
    'volounteered': ['volunteered'],
    'volounteering': ['volunteering'],
    'volounteers': ['volunteers'],
    'volumne': ['volume'],
    'vreity': ['variety'],
    'vrey': ['very'],
    'vriety': ['variety'],
    'vulnerablility': ['vulnerability'],
    'vulnerable': ['vulnerable'],
    'waht': ['what'],
    'warrent': ['warrant'],
    'warrriors': ['warriors'],
    'wasnt': ['wasn\'t'],
    'wass': ['was'],
    'watn': ['want'],
    'wayword': ['wayward'],
    'we;d': ['we\'d'],
    'weaponary': ['weaponry'],
    'weas': ['was'],
    'wehn': ['when'],
    'weigth': ['weight'],
    'weild': ['wield'],
    'weilded': ['wielded'],
    'wendsday': ['wednesday'],
    'wensday': ['wednesday'],
    'wereabouts': ['whereabouts'],
    'whcih': ['which'],
    'wheras': ['whereas'],
    'wherease': ['whereas'],
    'whereever': ['wherever'],
    'whic': ['which'],
    'whihc': ['which'],
    'whith': ['with'],
    'whlch': ['which'],
    'whn': ['when'],
    'wholey': ['wholly'],
    'wholistic': ['holistic'],
    'wholy': ['wholly'],
    'whta': ['what'],
    'whther': ['whether'],
    'wich': ['which'],
    'widesread': ['widespread'],
    'wief': ['wife'],
    'wiew': ['view'],
    'wih': ['with'],
    'wiht': ['with'],
    'wille': ['will'],
    'willingless': ['willingness'],
    'windoes': ['windows'],
    'wintery': ['wintry'],
    'wirting': ['writing'],
    'withdrawl': ['withdrawal'],
    'witheld': ['withheld'],
    'withh': ['with'],
    'withing': ['within'],
    'withold': ['withhold'],
    'witn': ['with'],
    'wiull': ['will'],
    'wnat': ['want'],
    'wnated': ['wanted'],
    'wnats': ['wants'],
    'wohle': ['whole'],
    'wokr': ['work'],
    'wokring': ['working'],
    'wonderfull': ['wonderful'],
    'wordlwide': ['worldwide'],
    'workststion': ['workstation'],
    'worls': ['world'],
    'worstened': ['worsened'],
    'worstenning': ['worsening'],
    'woudl': ['would'],
    'wresters': ['wrestlers'],
    'wriet': ['write'],
    'writen': ['written'],
    'wroet': ['wrote'],
    'wrok': ['work'],
    'wroking': ['working'],
    'wtih': ['with'],
    'wupport': ['support'],
    'xenophoby': ['xenophobia'],
    'yaching': ['yachting'],
    'yaer': ['year'],
    'yaerly': ['yearly'],
    'yaers': ['years'],
    'yatch': ['yacht'],
    'yearm': ['year'],
    'yeasr': ['years'],
    'yeild': ['yield'],
    'yeilding': ['yielding'],
    'yera': ['year'],
    'yeras': ['years'],
    'yersa': ['years'],
    'yotube': ['youtube'],
    'youseff': ['yousef'],
    'youself': ['yourself'],
    'ytou': ['you'],
    'yuo': ['you'],
    'zeebra': ['zebra']
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
    return this.commonMistakes[word.toLowerCase()] || [];
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
