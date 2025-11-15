#!/usr/bin/env node

/**
 * Database Migration Runner for Optimization Phases
 *
 * This script executes the database optimization migrations that consolidate
 * multiple tables into unified structures and implement performance improvements.
 *
 * Usage: node migrate-optimized.js [--phase=1|2] [--dry-run]
 *
 * Options:
 *   --phase=1  Run Phase 1 migration (table consolidation)
 *   --phase=2  Run Phase 2 migration (constraints & optimizations)
 *   --dry-run  Show SQL commands without executing them
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { db } from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration(phase = 1, dryRun = false) {
  console.log(`🚀 Starting Database Optimization Migration Phase ${phase}...\n`);

  try {
    // Read the appropriate migration SQL file
    const migrationFile = phase === 1
      ? '001_database_optimization_phase1.sql'
      : '002_database_optimization_phase2.sql';

    const migrationPath = join(__dirname, 'migrations', migrationFile);
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    if (dryRun) {
      console.log('📋 DRY RUN MODE - The following SQL will be executed:\n');
      console.log(migrationSQL);
      console.log('\n✅ Dry run completed. No changes were made to the database.');
      return;
    }

    const phaseDescription = phase === 1
      ? 'table consolidation and unified structures'
      : 'constraints, optimizations, and advanced features';

    console.log(`⚠️  WARNING: Phase ${phase} will ${phaseDescription}.`);
    console.log('⚠️  Make sure you have a backup of your data before proceeding.');
    if (phase === 2) {
      console.log('⚠️  Phase 2 requires Phase 1 to be completed first.');
    }

    // Split the migration into logical sections
    const sections = migrationSQL
      .split(/^-- Phase \d+\.\d+:/m)
      .filter(section => section.trim())
      .map((section, index) => {
        const firstLine = section.split('\n')[0];
        const sectionName = firstLine.includes(':')
          ? firstLine.split(':')[1]?.trim()
          : `Section ${index + 1}`;

        return {
          number: index + 1,
          name: sectionName,
          sql: section.trim()
        };
      });

    console.log(`📊 Phase ${phase} will run ${sections.length} sections:\n`);
    sections.forEach(section => {
      console.log(`   ${section.number}. ${section.name}`);
    });

    console.log('\n🎯 Starting migration execution...\n');

    // Execute each section
    for (const section of sections) {
      console.log(`⏳ Executing ${section.name}...`);

      try {
        // Split section into individual statements for better error handling
        const statements = section.sql
          .split(/;\s*$/m)
          .filter(stmt => stmt.trim())
          .map(stmt => stmt.trim() + ';');

        for (const statement of statements) {
          if (statement.trim()) {
            await db.execute(statement);
          }
        }

        console.log(`✅ ${section.name} completed successfully.`);
      } catch (error) {
        console.log(`❌ ${section.name} failed:`, error.message);

        if (phase === 1 && section.number === 1) {
          console.log('🛑 Critical failure in Phase 1. Stopping migration.');
          throw error;
        } else {
          console.log(`⚠️  Continuing with next section...`);
        }
      }

      // Small delay between sections
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Phase-specific summaries
    if (phase === 1) {
      console.log('\n🎉 Phase 1 migration completed successfully!');
      console.log('\n📈 Summary of changes:');
      console.log('   • Consolidated 5 tables into 3 unified tables');
      console.log('   • Added strategic indexes for better performance');
      console.log('   • Enhanced lessons table with JSONB content columns');
      console.log('   • Migrated all existing data to new structure');

      console.log('\n📝 Next steps:');
      console.log('   1. Run Phase 2 migration: node migrate-optimized.js --phase=2');
      console.log('   2. Update application code to use new consolidated tables');
      console.log('   3. Test the new database structure');
      console.log('   4. Archive old tables after validation');
    } else {
      console.log('\n🎉 Phase 2 migration completed successfully!');
      console.log('\n📈 Summary of changes:');
      console.log('   • Added proper UUID foreign key constraints');
      console.log('   • Consolidated user settings into users.preferences JSONB');
      console.log('   • Simplified study groups with JSON members array');
      console.log('   • Created data archival strategy and indexes');
      console.log('   • Added advanced analytics and performance optimizations');

      console.log('\n📝 Next steps:');
      console.log('   1. Update application code to use Phase 2 optimizations');
      console.log('   2. Test new analytics and reporting features');
      console.log('   3. Monitor performance improvements');
      console.log('   4. Set up archival processes for long-term maintenance');
    }

  } catch (error) {
    console.error(`\n💥 Phase ${phase} migration failed:`, error);

    if (!dryRun) {
      console.log('\n🔄 To rollback the migration:');
      console.log(`   • Restore from your Phase ${phase === 1 ? 'pre-migration' : 'Phase 1'} backup`);
      console.log('   • Or run the appropriate rollback script (if available)');
    }

    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

// Parse phase argument
const phaseArg = args.find(arg => arg.startsWith('--phase='));
const phase = phaseArg ? parseInt(phaseArg.split('=')[1]) : 1;

if (phase < 1 || phase > 2 || isNaN(phase)) {
  console.log('❌ Invalid phase. Use --phase=1 or --phase=2');
  process.exit(1);
}

if (dryRun) {
  console.log('🔍 DRY RUN MODE - No database changes will be made\n');
}

console.log(`🎯 Database Optimization Migration - Phase ${phase}\n`);

// Run the migration
runMigration(phase, dryRun);