import { Box, Text } from 'ink'
import Spinner from 'ink-spinner'
import type { ToolCallDisplay } from './types.js'

interface ToolCallProps {
  toolCall: ToolCallDisplay
}

export function ToolCall({ toolCall }: ToolCallProps) {
  const getStatusIcon = () => {
    switch (toolCall.status) {
      case 'running':
        return (
          <Text color="yellow">
            <Spinner type="dots" />
          </Text>
        )
      case 'completed':
        return <Text color="green">✓</Text>
      case 'error':
        return <Text color="red">✗</Text>
      default:
        return <Text color="gray">○</Text>
    }
  }

  const getToolEmoji = (toolName: string): string => {
    const emojiMap: Record<string, string> = {
      read_file: '📖',
      write_file: '✍️',
      edit_file: '✏️',
      list_dir: '📁',
      glob_search: '🔍',
      grep_search: '🔎',
      run_command: '⚡',
    }
    return emojiMap[toolName] || '🔧'
  }

  return (
    <Box flexDirection="column" marginBottom={1} paddingLeft={2}>
      <Box>
        {getStatusIcon()}
        <Text> </Text>
        <Text bold>
          {getToolEmoji(toolCall.toolName)} {toolCall.toolName}
        </Text>
      </Box>

      {Object.keys(toolCall.params).length > 0 && (
        <Box marginLeft={3} flexDirection="column">
          <Text dimColor>Parameters:</Text>
          {Object.entries(toolCall.params).map(([key, value]) => (
            <Box key={key} marginLeft={2}>
              <Text dimColor>{key}: </Text>
              <Text>
                {typeof value === 'string' && value.length > 50
                  ? `${value.substring(0, 50)}...`
                  : String(value)}
              </Text>
            </Box>
          ))}
        </Box>
      )}

      {toolCall.result && toolCall.status === 'completed' && (
        <Box marginLeft={3}>
          <Text color="green">✓ </Text>
          <Text dimColor>
            {toolCall.result.length > 100
              ? `${toolCall.result.substring(0, 100)}...`
              : toolCall.result}
          </Text>
        </Box>
      )}

      {toolCall.result && toolCall.status === 'error' && (
        <Box marginLeft={3}>
          <Text color="red">✗ {toolCall.result}</Text>
        </Box>
      )}
    </Box>
  )
}
