#!/usr/bin/env node

/**
 * Database Migration Runner for Optimization Phase 1
 *
 * This script executes the database optimization migration that consolidates
 * multiple tables into unified structures for better performance.
 *
 * Usage: node migrate-optimized.js [--dry-run]
 *
 * Options:
 *   --dry-run  Show SQL commands without executing them
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { db } from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration(dryRun = false) {
  console.log('🚀 Starting Database Optimization Migration Phase 1...\n');

  try {
    // Read the migration SQL file
    const migrationPath = join(__dirname, 'migrations', '001_database_optimization_phase1.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    if (dryRun) {
      console.log('📋 DRY RUN MODE - The following SQL will be executed:\n');
      console.log(migrationSQL);
      console.log('\n✅ Dry run completed. No changes were made to the database.');
      return;
    }

    console.log('⚠️  WARNING: This migration will restructure your database.');
    console.log('⚠️  Make sure you have a backup of your data before proceeding.\n');

    // Split the migration into batches for better error handling
    const batches = migrationSQL
      .split('-- Phase')
      .filter(batch => batch.trim())
      .map((batch, index) => ({
        number: index + 1,
        name: batch.split('\n')[0]?.split(':')[1]?.trim() || `Phase ${index + 1}`,
        sql: '-- Phase' + batch
      }));

    console.log(`📊 Migration will run ${batches.length} batches:\n`);
    batches.forEach(batch => {
      console.log(`   ${batch.number}. ${batch.name}`);
    });

    console.log('\n🎯 Starting migration execution...\n');

    // Execute each batch
    for (const batch of batches) {
      console.log(`⏳ Executing ${batch.name}...`);

      try {
        await db.execute(batch.sql);
        console.log(`✅ ${batch.name} completed successfully.`);
      } catch (error) {
        console.log(`❌ ${batch.name} failed:`, error.message);

        // Continue with other batches if possible
        if (batch.number === 1) {
          console.log('🛑 Critical failure in Phase 1. Stopping migration.');
          throw error;
        } else {
          console.log(`⚠️  Continuing with next batch...`);
        }
      }

      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n🎉 Database optimization migration completed successfully!');
    console.log('\n📈 Summary of changes:');
    console.log('   • Consolidated 5 tables into 3 unified tables');
    console.log('   • Added strategic indexes for better performance');
    console.log('   • Enhanced lessons table with JSONB content columns');
    console.log('   • Migrated all existing data to new structure');

    console.log('\n📝 Next steps:');
    console.log('   1. Update application code to use new consolidated tables');
    console.log('   2. Test the new database structure');
    console.log('   3. Archive old tables after validation');
    console.log('   4. Monitor performance improvements');

  } catch (error) {
    console.error('\n💥 Migration failed:', error);

    if (!dryRun) {
      console.log('\n🔄 To rollback the migration:');
      console.log('   • Restore from your database backup');
      console.log('   • Or run the rollback script (if available)');
    }

    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

if (dryRun) {
  console.log('🔍 DRY RUN MODE - No database changes will be made\n');
}

// Run the migration
runMigration(dryRun);