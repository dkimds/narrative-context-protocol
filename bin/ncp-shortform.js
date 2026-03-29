#!/usr/bin/env node

const { program } = require('commander');
const inquirer = require('inquirer');
const path = require('path');
const fs = require('fs');
const { ShortformAssistant } = require('../lib/shortform-assistant');
const { validateFile } = require('../lib/validator');

const assistant = new ShortformAssistant();

program
  .name('ncp-shortform')
  .description('NCP 숏폼 드라마 시리즈 작성 어시스턴트')
  .version('1.0.0');

program
  .command('init')
  .description('새 숏폼 시리즈 프로젝트 시작')
  .action(async () => {
    console.log('\n🎬 숏폼 드라마 시리즈 프로젝트를 시작합니다.\n');

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'title',
        message: '시리즈 제목을 입력하세요:',
        validate: (input) => input.trim() !== '' || '제목을 입력해주세요.'
      },
      {
        type: 'number',
        name: 'totalEpisodes',
        message: '전체 회차 수를 입력하세요:',
        default: 60,
        validate: (input) => input > 0 || '1 이상의 숫자를 입력해주세요.'
      },
      {
        type: 'number',
        name: 'phase1End',
        message: '무료 구간 마지막 회차 (기본값: 10):',
        default: 10
      },
      {
        type: 'number',
        name: 'finalArcOffset',
        message: '최종 결말 구간 시작 오프셋 (기본값: 10):',
        default: 10
      },
      {
        type: 'input',
        name: 'genre',
        message: '장르를 입력하세요 (예: 로맨스, 스릴러, 직장물):',
        default: '로맨스'
      },
      {
        type: 'input',
        name: 'mcName',
        message: '메인 캐릭터(MC) 이름:',
        validate: (input) => input.trim() !== '' || '이름을 입력해주세요.'
      },
      {
        type: 'input',
        name: 'mcDescription',
        message: 'MC 한 줄 설명:',
        validate: (input) => input.trim() !== '' || '설명을 입력해주세요.'
      },
      {
        type: 'input',
        name: 'icName',
        message: '인플루언스 캐릭터(IC) 이름:',
        validate: (input) => input.trim() !== '' || '이름을 입력해주세요.'
      },
      {
        type: 'input',
        name: 'icDescription',
        message: 'IC 한 줄 설명:',
        validate: (input) => input.trim() !== '' || '설명을 입력해주세요.'
      },
      {
        type: 'list',
        name: 'outcome',
        message: '시리즈 결말 outcome:',
        choices: ['success', 'failure'],
        default: 'success'
      },
      {
        type: 'list',
        name: 'judgment',
        message: '시리즈 결말 judgment:',
        choices: ['good', 'bad'],
        default: 'good'
      },
      {
        type: 'number',
        name: 'targetDuration',
        message: '에피소드 길이 (초):',
        choices: [90, 120],
        default: 90
      }
    ]);

    // 유효성 검사
    const validation = assistant.validateSeriesConfig(answers);
    if (!validation.valid) {
      console.error(`\n❌ 오류: ${validation.error}\n`);
      return;
    }

    // 시리즈 설정 저장
    const config = assistant.initializeSeries(answers);

    // config.json 저장
    const configPath = path.join(process.cwd(), 'ncp-series-config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');

    // examples 디렉토리 생성
    const examplesDir = path.join(process.cwd(), 'examples');
    if (!fs.existsSync(examplesDir)) {
      fs.mkdirSync(examplesDir, { recursive: true });
    }

    // 시리즈 바이블 출력
    console.log('\n' + '='.repeat(60));
    console.log('📖 시리즈 바이블');
    console.log('='.repeat(60));
    console.log(assistant.generateSeriesBible(config));
    console.log('='.repeat(60));
    console.log(`\n✅ 설정이 저장되었습니다: ${configPath}`);
    console.log(`\n다음 단계: ncp-shortform ideation 1\n`);
  });

program
  .command('ideation <phase>')
  .description('아이데이션 생성 (phase: 1, 2, 3)')
  .action(async (phase) => {
    const phaseNum = parseInt(phase);
    if (![1, 2, 3].includes(phaseNum)) {
      console.error('❌ phase는 1, 2, 또는 3이어야 합니다.');
      return;
    }

    // 설정 파일 읽기
    const configPath = path.join(process.cwd(), 'ncp-series-config.json');
    if (!fs.existsSync(configPath)) {
      console.error('❌ 설정 파일이 없습니다. 먼저 "ncp-shortform init"을 실행하세요.');
      return;
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    console.log(`\n🎨 ${phaseNum}차 아이데이션을 시작합니다.\n`);

    // 연속성 브리지 출력 (2차, 3차일 때)
    if (phaseNum > 1) {
      const bridge = assistant.generateContinuityBridge(phaseNum, config);
      console.log(bridge);
    }

    // 아이데이션 질문 출력
    const questions = assistant.getIdeationQuestions(phaseNum);
    console.log('탐색 초점:\n');
    console.log(questions);
    console.log('\n위 질문들을 바탕으로 각 카테고리별 노드를 작성하세요.\n');

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: '대화형으로 아이데이션 노드를 입력하시겠습니까?',
        default: true
      }
    ]);

    if (!confirm) {
      console.log('\n수동으로 examples/ideation-phase' + phaseNum + '.json 을 작성하세요.\n');
      return;
    }

    // 대화형 아이데이션 노드 입력
    const ideation = await assistant.interactiveIdeation(phaseNum, config);

    // JSON 생성
    const ideationJson = assistant.generateIdeationJson(phaseNum, config, ideation);

    // 파일 저장
    const outputPath = path.join(process.cwd(), 'examples', `ideation-phase${phaseNum}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(ideationJson, null, 2), 'utf-8');

    console.log(`\n✅ 아이데이션이 저장되었습니다: ${outputPath}`);
    console.log(`\n검증: npm run validate:file -- ${outputPath}\n`);
  });

program
  .command('episode <number>')
  .description('에피소드 작성')
  .action(async (number) => {
    const episodeNum = parseInt(number);
    if (isNaN(episodeNum) || episodeNum < 1) {
      console.error('❌ 올바른 회차 번호를 입력하세요.');
      return;
    }

    // 설정 파일 읽기
    const configPath = path.join(process.cwd(), 'ncp-series-config.json');
    if (!fs.existsSync(configPath)) {
      console.error('❌ 설정 파일이 없습니다. 먼저 "ncp-shortform init"을 실행하세요.');
      return;
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    // 진행 상황 표시
    const progressInfo = assistant.getProgressInfo(episodeNum, config);
    console.log(`\n${progressInfo}\n`);

    // 에피소드 내용 제안 입력
    console.log(`## ${episodeNum}회 에피소드 작성\n`);

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'subtitle',
        message: '회차 부제목:',
        validate: (input) => input.trim() !== '' || '부제목을 입력해주세요.'
      },
      {
        type: 'input',
        name: 'seriesPosition',
        message: '시리즈 위치 (전체 arc에서의 역할):',
        validate: (input) => input.trim() !== '' || '내용을 입력해주세요.'
      },
      {
        type: 'input',
        name: 'ki',
        message: '기 (설정):',
        validate: (input) => input.trim() !== '' || '내용을 입력해주세요.'
      },
      {
        type: 'number',
        name: 'kiDuration',
        message: '기 길이 (초):',
        default: 20
      },
      {
        type: 'input',
        name: 'seung',
        message: '승 (갈등):',
        validate: (input) => input.trim() !== '' || '내용을 입력해주세요.'
      },
      {
        type: 'number',
        name: 'seungDuration',
        message: '승 길이 (초):',
        default: 35
      },
      {
        type: 'input',
        name: 'jeon',
        message: '전 (반전):',
        validate: (input) => input.trim() !== '' || '내용을 입력해주세요.'
      },
      {
        type: 'number',
        name: 'jeonDuration',
        message: '전 길이 (초):',
        default: 25
      },
      {
        type: 'input',
        name: 'gyeol',
        message: '결 (해소):',
        validate: (input) => input.trim() !== '' || '내용을 입력해주세요.'
      },
      {
        type: 'number',
        name: 'gyeolDuration',
        message: '결 길이 (초):',
        default: 10
      },
      {
        type: 'input',
        name: 'coreEmotion',
        message: '이번 회차 핵심 감정:',
        default: '기대'
      },
      {
        type: 'input',
        name: 'nextHook',
        message: '다음 회차 연결고리:',
        validate: (input) => input.trim() !== '' || '내용을 입력해주세요.'
      }
    ]);

    // 에피소드 제안 출력
    console.log(assistant.generateEpisodeProposal(episodeNum, answers));

    const { confirmEpisode } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmEpisode',
        message: 'JSON을 생성하시겠습니까?',
        default: true
      }
    ]);

    if (!confirmEpisode) {
      console.log('\n에피소드 작성이 취소되었습니다.\n');
      return;
    }

    // 에피소드 JSON 생성
    const episodeJson = assistant.generateEpisodeJson(episodeNum, config, answers);

    // 파일 저장
    const outputPath = path.join(process.cwd(), 'examples', `ep${episodeNum.toString().padStart(2, '0')}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(episodeJson, null, 2), 'utf-8');

    console.log(`\n✅ 에피소드가 저장되었습니다: ${outputPath}`);
    console.log(`\n검증: npm run validate:file -- ${outputPath}\n`);
  });

program
  .command('validate [file]')
  .description('NCP JSON 파일 검증')
  .action(async (file) => {
    if (!file) {
      console.log('검증할 파일 경로를 지정하세요.');
      return;
    }

    const result = validateFile(file);
    if (result.valid) {
      console.log(`✅ ${file} 검증 성공`);
    } else {
      console.error(`❌ ${file} 검증 실패:`);
      console.error(result.errors);
    }
  });

program.parse();
