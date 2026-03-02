#!/usr/bin/env node
/**
 * Episode validation helper
 *
 * Usage:
 *   node scripts/ep.js <episode_number>   — validate a single episode
 *   node scripts/ep.js all                — validate all productions/*.json
 *
 * Via npm:
 *   npm run ep -- 2
 *   npm run ep -- all
 */

const Ajv = require('ajv');
const fs = require('fs');
const path = require('path');

const repoRoot = path.join(__dirname, '..');
const productionsDir = path.join(repoRoot, 'productions');
const schemaPath = path.join(repoRoot, 'schema/ncp-schema.json');

const arg = process.argv[2];

if (!arg) {
    console.error('Usage: node scripts/ep.js <episode_number|all>');
    console.error('  node scripts/ep.js 2     → validate productions/ep02.json');
    console.error('  node scripts/ep.js all   → validate all productions/*.json');
    process.exit(1);
}

const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const ajv = new Ajv({ allErrors: true, strict: false });
const validate = ajv.compile(schema);

function formatErrors(errors) {
    return (errors || [])
        .map((e) => `  ${e.instancePath || '/'} ${e.message}`)
        .join('\n');
}

function validateFile(filePath) {
    const label = path.relative(repoRoot, filePath);
    let data;
    try {
        data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (err) {
        console.error(`FAIL ${label}: JSON parse error — ${err.message}`);
        return false;
    }
    const ok = validate(data);
    if (ok) {
        console.log(`PASS ${label}`);
        return true;
    } else {
        console.error(`FAIL ${label}:\n${formatErrors(validate.errors)}`);
        return false;
    }
}

let files;

if (arg === 'all') {
    if (!fs.existsSync(productionsDir)) {
        console.error('productions/ directory not found');
        process.exit(1);
    }
    files = fs.readdirSync(productionsDir)
        .filter((f) => f.endsWith('.json'))
        .sort()
        .map((f) => path.join(productionsDir, f));

    if (files.length === 0) {
        console.log('No JSON files found in productions/');
        process.exit(0);
    }
} else {
    const padded = String(arg).padStart(2, '0');
    const filePath = path.join(productionsDir, `ep${padded}.json`);
    if (!fs.existsSync(filePath)) {
        console.error(`File not found: productions/ep${padded}.json`);
        process.exit(1);
    }
    files = [filePath];
}

let failures = 0;
for (const f of files) {
    if (!validateFile(f)) failures++;
}

if (failures > 0) {
    console.error(`\n${failures} file(s) failed validation.`);
    process.exit(1);
} else {
    console.log(`\nAll ${files.length} file(s) passed.`);
}
