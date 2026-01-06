import { type Change, diffLines } from 'diff'
import { Box, Text } from 'ink'
import type { DiffViewProps } from './types.js'

export function DiffView({ filePath, oldContent, newContent }: DiffViewProps) {
  const changes = diffLines(oldContent, newContent)

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="blue" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          📝 Changes in {filePath}
        </Text>
      </Box>

      {changes.map((change: Change, idx: number) => {
        if (change.added) {
          return (
            <Box key={idx}>
              <Text color="green" bold>
                + {change.value}
              </Text>
            </Box>
          )
        }

        if (change.removed) {
          return (
            <Box key={idx}>
              <Text color="red" bold>
                - {change.value}
              </Text>
            </Box>
          )
        }

        // Context lines (unchanged)
        const lines = change.value.split('\n').slice(0, 2) // Show first 2 lines of context
        return (
          <Box key={idx} flexDirection="column">
            {lines.map((line, lineIdx) =>
              line ? (
                <Text key={lineIdx} dimColor>
                  {line}
                </Text>
              ) : null
            )}
          </Box>
        )
      })}
    </Box>
  )
}
