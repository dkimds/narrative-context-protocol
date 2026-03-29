const { v4: uuidv4 } = require('uuid');
const inquirer = require('inquirer');

class ShortformAssistant {
  constructor() {
    this.config = null;
  }

  validateSeriesConfig(answers) {
    const { totalEpisodes, phase1End, finalArcOffset } = answers;

    // 조건 1: phase1_end >= total_episodes - final_arc_offset
    if (phase1End >= totalEpisodes - finalArcOffset) {
      return {
        valid: false,
        error: `구간 경계값이 올바르지 않습니다.\n` +
          `- 1차 구간 끝(${phase1End}회)은 유료 구간 시작보다 작아야 합니다.\n` +
          `- 유료 구간: ${phase1End + 1}회 ~ ${totalEpisodes - finalArcOffset}회\n` +
          `- 최종 결말 구간: ${totalEpisodes - finalArcOffset + 1}회 ~ ${totalEpisodes}회\n` +
          `다시 입력해 주세요.`
      };
    }

    // 조건 2: final_arc_offset >= total_episodes
    if (finalArcOffset >= totalEpisodes) {
      return {
        valid: false,
        error: `최종결말 구간이 전체를 초과합니다.\n` +
          `final_arc_offset(${finalArcOffset})는 total_episodes(${totalEpisodes})보다 작아야 합니다.`
      };
    }

    return { valid: true };
  }

  initializeSeries(answers) {
    this.config = {
      title: answers.title,
      totalEpisodes: answers.totalEpisodes,
      phase1End: answers.phase1End || 10,
      finalArcOffset: answers.finalArcOffset || 10,
      genre: answers.genre,
      mc: {
        name: answers.mcName,
        description: answers.mcDescription
      },
      ic: {
        name: answers.icName,
        description: answers.icDescription
      },
      outcome: answers.outcome,
      judgment: answers.judgment,
      targetDuration: answers.targetDuration || 90,
      // 파생 구간 계산
      freePhase: {
        start: 1,
        end: answers.phase1End || 10
      },
      paidPhase: {
        start: (answers.phase1End || 10) + 1,
        end: answers.totalEpisodes - (answers.finalArcOffset || 10)
      },
      finalPhase: {
        start: answers.totalEpisodes - (answers.finalArcOffset || 10) + 1,
        end: answers.totalEpisodes
      },
      // 시리즈 전체에서 재사용할 ID
      perspectiveIds: {
        mc: uuidv4(),
        ic: uuidv4()
      },
      playerIds: {
        mc: uuidv4(),
        ic: uuidv4()
      }
    };

    return this.config;
  }

  generateSeriesBible(config) {
    return `
시리즈: ${config.title} (총 ${config.totalEpisodes}회)
장르: ${config.genre}
MC: ${config.mc.name} — ${config.mc.description}
IC: ${config.ic.name} — ${config.ic.description}
시리즈 결말: outcome=${config.outcome}, judgment=${config.judgment}
에피소드 길이: ${config.targetDuration}초

[시리즈 구간]
- 무료 구간 (1차 아이데이션): ${config.freePhase.start}~${config.freePhase.end}회
- 유료 구간 (2차 아이데이션): ${config.paidPhase.start}~${config.paidPhase.end}회
- 최종 결말 구간 (3차 아이데이션): ${config.finalPhase.start}~${config.finalPhase.end}회
`;
  }

  getIdeationQuestions(phase) {
    const questions = {
      1: {
        character: 'MC와 IC의 첫인상, 욕망, 결핍은 무엇인가? 독자가 무료 구간에서 어떤 캐릭터에 빠져들게 할 것인가?',
        theme: '이 시리즈가 던지는 핵심 질문은 무엇인가? 무료 구간에서 어떤 테마의 씨앗을 심을 것인가?',
        plot: '무료 구간의 핵심 갈등 씨앗은 무엇인가? 마지막 무료 회차에서 독자를 유료로 끌어당기는 훅은 무엇인가?',
        genre: '장르 톤과 분위기를 어떻게 설정할 것인가? 숏폼 특성상 어떤 장르 관습을 활용할 것인가?'
      },
      2: {
        character: '유료 구간에서 MC와 IC의 관계가 어떻게 변화하는가? 캐릭터의 결핍이 어떻게 심화되는가?',
        theme: '1차에서 심은 테마 씨앗이 유료 구간에서 어떻게 복잡해지는가?',
        plot: '핵심 갈등이 어떻게 심화되는가? 중간 반전 플롯은 무엇인가?',
        genre: '유료 구간에서 장르 톤이 어떻게 변화하는가?'
      },
      3: {
        character: 'MC의 최종 변화(resolve)는 무엇인가? 캐릭터가 최종적으로 어떤 상태에 도달하는가?',
        theme: '시리즈 전체가 던진 질문에 대한 답은 무엇인가? 테마가 어떻게 해소되는가?',
        plot: '핵심 갈등이 어떻게 해소되는가? 시리즈 전체 outcome/judgment는 무엇인가?',
        genre: '결말이 장르 관습을 어떻게 충족하거나 뒤집는가?'
      }
    };

    const q = questions[phase];
    return `[character] ${q.character}
[theme] ${q.theme}
[plot] ${q.plot}
[genre] ${q.genre}`;
  }

  generateContinuityBridge(phase, config) {
    if (phase === 2) {
      return `
━━━ 연속성 브리지: 1차 → 2차 ━━━

[1차에서 확립된 것]
캐릭터: ${config.mc.name} (MC), ${config.ic.name} (IC)
핵심 갈등 씨앗: (1차 아이데이션에서 확인)
테마 방향: (1차 아이데이션에서 확인)
무료 구간 마지막 훅: (${config.freePhase.end}회의 결말)

[2차에서 이어받아야 할 것]
- 위 갈등 씨앗이 어떻게 심화되는가?
- 캐릭터 관계가 어떤 방향으로 변화하는가?
- 테마가 어떻게 복잡해지는가?

위 내용을 바탕으로 2차 아이데이션을 시작합니다.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
    } else if (phase === 3) {
      return `
━━━ 연속성 브리지: 1차+2차 → 3차 ━━━

[시리즈 전체 흐름 요약]
캐릭터 여정: ${config.mc.name}와 ${config.ic.name}의 1차~2차 동안의 변화 궤적
핵심 갈등 현황: 1차에서 심은 갈등 씨앗이 2차에서 어떻게 심화되었는가
관계 변화: MC-IC 관계의 1차~2차 동안의 변화
테마 누적: 1차+2차에서 쌓아온 테마의 핵심 질문

[3차에서 해소해야 할 것]
- 핵심 갈등을 어떻게 해소할 것인가?
- MC의 최종 변화(resolve)는 무엇인가?
- IC와의 관계는 어떻게 마무리되는가?
- 시리즈 전체 outcome/judgment를 어떻게 확정할 것인가?

위 내용을 바탕으로 3차 아이데이션을 시작합니다.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
    }
  }

  async interactiveIdeation(phase, config) {
    const categories = ['character', 'theme', 'plot', 'genre'];
    const ideation = {};

    for (const category of categories) {
      console.log(`\n[${category}] 카테고리 노드 입력:`);
      const nodes = [];
      let nodeIndex = 1;

      while (true) {
        const { addNode } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'addNode',
            message: `${category} 노드를 추가하시겠습니까?`,
            default: nodeIndex === 1
          }
        ]);

        if (!addNode) break;

        const node = await inquirer.prompt([
          {
            type: 'input',
            name: 'summary',
            message: '노드 내용 요약:',
            validate: (input) => input.trim() !== '' || '내용을 입력해주세요.'
          },
          {
            type: 'input',
            name: 'title',
            message: '노드 제목 (선택):',
            default: ''
          },
          {
            type: 'input',
            name: 'notes',
            message: '메모 (선택):',
            default: ''
          },
          {
            type: 'input',
            name: 'tags',
            message: '태그 (쉼표로 구분):',
            default: ''
          }
        ]);

        nodes.push({
          id: `idea_${category}_p${phase}_${nodeIndex.toString().padStart(3, '0')}`,
          summary: node.summary,
          ...(node.title && { title: node.title }),
          ...(node.notes && { notes: node.notes }),
          tags: node.tags ? node.tags.split(',').map(t => t.trim()).filter(t => t) : []
        });

        nodeIndex++;
      }

      ideation[category] = nodes;
    }

    return ideation;
  }

  generateIdeationJson(phase, config, ideation) {
    const slug = config.title.toLowerCase().replace(/\s+/g, '-');

    return {
      schema_version: '1.3.0',
      story: {
        id: `story_${slug}-ideation-phase${phase}`,
        title: `${config.title} — ${phase}차 아이데이션`,
        genre: config.genre,
        logline: `${config.title} 시리즈 ${phase}차 아이데이션`,
        created_at: new Date().toISOString(),
        ideation: ideation,
        narratives: []
      }
    };
  }

  getProgressInfo(episodeNum, config) {
    let currentPhase = '무료';
    let ideationPhase = '1차 완료';

    if (episodeNum >= config.finalPhase.start) {
      currentPhase = '최종결말';
      ideationPhase = '3차 완료';
    } else if (episodeNum >= config.paidPhase.start) {
      currentPhase = '유료';
      ideationPhase = '2차 완료';
    }

    return `[진행] ${episodeNum}회 / 총 ${config.totalEpisodes}회 | 현재 구간: ${currentPhase} | 아이데이션: ${ideationPhase}`;
  }

  generateEpisodeProposal(episodeNum, answers) {
    return `
${'='.repeat(60)}
## ${episodeNum}회 — ${answers.subtitle}
${'='.repeat(60)}

시리즈 위치: ${answers.seriesPosition}

기 (설정, ${answers.kiDuration}초): ${answers.ki}
승 (갈등, ${answers.seungDuration}초): ${answers.seung}
전 (반전, ${answers.jeonDuration}초): ${answers.jeon}
결 (해소, ${answers.gyeolDuration}초): ${answers.gyeol}

이번 회차 핵심 감정: ${answers.coreEmotion}
다음 회차 연결고리: ${answers.nextHook}
${'='.repeat(60)}
`;
  }

  generateEpisodeJson(episodeNum, config, answers) {
    const slug = config.title.toLowerCase().replace(/\s+/g, '-');
    const episodeId = episodeNum.toString().padStart(2, '0');

    return {
      schema_version: '1.3.0',
      story: {
        id: `story_${slug}-ep${episodeId}`,
        title: `${config.title} ${episodeNum}회 — ${answers.subtitle}`,
        genre: config.genre,
        logline: answers.seriesPosition,
        created_at: new Date().toISOString(),
        format: 'short_form',
        target_duration_seconds: config.targetDuration,
        ideation: {
          character: [],
          theme: [],
          plot: [],
          genre: []
        },
        narratives: [
          {
            id: `narrative_ep${episodeId}-001`,
            title: '중심 내러티브',
            subtext: {
              perspectives: [
                {
                  id: config.perspectiveIds.mc,
                  name: `${config.mc.name} perspective`,
                  type: 'Main Character',
                  description: config.mc.description
                },
                {
                  id: config.perspectiveIds.ic,
                  name: `${config.ic.name} perspective`,
                  type: 'Influence Character',
                  description: config.ic.description
                }
              ],
              players: [
                {
                  id: config.playerIds.mc,
                  name: config.mc.name,
                  role: 'protagonist',
                  perspective_id: config.perspectiveIds.mc
                },
                {
                  id: config.playerIds.ic,
                  name: config.ic.name,
                  role: 'impact',
                  perspective_id: config.perspectiveIds.ic
                }
              ],
              dynamics: [
                {
                  id: `dynamic_ep${episodeId}_001`,
                  story_outcome: config.outcome,
                  story_judgment: config.judgment,
                  main_character_resolve: 'change'
                }
              ],
              storypoints: [],
              storybeats: [
                {
                  id: `beat_ep${episodeId}-1`,
                  scope: 'signpost',
                  sequence: episodeNum,
                  narrative_function: 'Understanding',
                  summary: `${episodeNum}회 핵심 비트`,
                  storytelling: answers.seriesPosition,
                  perspectives: [
                    {
                      perspective_id: config.perspectiveIds.mc,
                      appreciation: 'Main Character Concern'
                    }
                  ]
                }
              ]
            },
            storytelling: {
              overviews: [
                {
                  context: 'narrative',
                  summary: `${episodeNum}회: ${answers.subtitle}`
                }
              ],
              moments: [
                {
                  act: 1,
                  order: 1,
                  summary: `기 — ${answers.ki}`,
                  fabric: [
                    {
                      type: 'duration',
                      limit: answers.kiDuration
                    }
                  ],
                  storybeats: [
                    {
                      storybeat_id: `beat_ep${episodeId}-1`
                    }
                  ]
                },
                {
                  act: 1,
                  order: 2,
                  summary: `승 — ${answers.seung}`,
                  fabric: [
                    {
                      type: 'duration',
                      limit: answers.seungDuration
                    }
                  ],
                  storybeats: []
                },
                {
                  act: 1,
                  order: 3,
                  summary: `전 — ${answers.jeon}`,
                  fabric: [
                    {
                      type: 'duration',
                      limit: answers.jeonDuration
                    }
                  ],
                  storybeats: []
                },
                {
                  act: 1,
                  order: 4,
                  summary: `결 — ${answers.gyeol}`,
                  fabric: [
                    {
                      type: 'duration',
                      limit: answers.gyeolDuration
                    }
                  ],
                  storybeats: []
                }
              ]
            }
          }
        ]
      }
    };
  }
}

module.exports = { ShortformAssistant };
