export const PRODUCT_NAME = 'Cogent'
export const VERSION = '1.0.0'

export const DEFAULT_MAX_TOKENS = 200000
export const DEFAULT_MAX_TURNS = 50
export const DEFAULT_MAX_STEPS = 30
export const DEFAULT_REFLECTION_ITERATIONS = 3

export const BACKUP_DIR = '.cogent-backups'
export const MEMORY_DIR = '.cogent-memory'

export const DANGEROUS_COMMANDS = [
  'rm -rf',
  'format',
  'mkfs',
  ':(){:|:&};:',
  'dd if=',
  'mv /* ',
  '> /dev/sda',
]

export const HIGH_RISK_PATTERNS = [
  /rm\s+-rf\s+[/~]/,
  /sudo\s+rm/,
  /chmod\s+-R\s+777/,
  /dd\s+if=/,
  /mkfs/,
  /:\(\)\{/,
]

export const RESTRICTED_PATHS = [
  '/etc',
  '/sys',
  '/proc',
  '/dev',
  '/boot',
  '/root',
  '~/.ssh',
  '~/.aws',
]
