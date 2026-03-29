#!/usr/bin/env node
/**
 * NCP JSON 검증 스크립트
 * Skill 번들 내에서 독립적으로 실행 가능
 */

const Ajv = require('ajv');
const fs = require('fs');
const path = require('path');

// Skill 번들 내 스키마 경로
const SCHEMA_PATH = path.join(__dirname, 'schema', 'ncp-schema.json');

function validateJson(jsonPath) {
  try {
    // 스키마 로드
    if (!fs.existsSync(SCHEMA_PATH)) {
      return {
        valid: false,
        error: `스키마 파일을 찾을 수 없습니다: ${SCHEMA_PATH}`
      };
    }

    const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf-8'));
    
    // JSON 파일 로드
    if (!fs.existsSync(jsonPath)) {
      return {
        valid: false,
        error: `JSON 파일을 찾을 수 없습니다: ${jsonPath}`
      };
    }

    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

    // Ajv 검증
    const ajv = new Ajv({ allErrors: true, strict: false });
    const validate = ajv.compile(schema);
    const valid = validate(data);

    if (!valid) {
      const errors = validate.errors.map(err => {
        return `  - ${err.instancePath || '/'}: ${err.message}`;
      }).join('\n');

      return {
        valid: false,
        error: `스키마 검증 실패:\n${errors}`
      };
    }

    return { valid: true };

  } catch (error) {
    return {
      valid: false,
      error: `검증 중 오류 발생: ${error.message}`
    };
  }
}

// CLI 실행
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('사용법: node validate.js <json-file-path>');
    process.exit(1);
  }

  const jsonPath = path.resolve(args[0]);
  const result = validateJson(jsonPath);

  if (result.valid) {
    console.log(`✅ 검증 성공: ${jsonPath}`);
    process.exit(0);
  } else {
    console.error(`❌ 검증 실패: ${jsonPath}`);
    console.error(result.error);
    process.exit(1);
  }
}

module.exports = { validateJson };
