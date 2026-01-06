import { Box, Text, useApp } from 'ink'
import Spinner from 'ink-spinner'
import { useEffect, useState } from 'react'
import { createAgent } from '../index.js'
import type { AgentState } from './types.js'

interface AppProps {
  task: string
  onComplete?: (result: any) => void
}

export function App({ task, onComplete }: AppProps) {
  const { exit } = useApp()
  const [state, setState] = useState<AgentState>({
    status: 'initializing',
    currentStep: 'Initializing agent...',
    steps: [],
    reasoning: [],
    toolCalls: [],
    output: [],
  })

  useEffect(() => {
    let mounted = true

    async function runAgent() {
      try {
        if (!mounted) return

        setState((prev) => ({
          ...prev,
          status: 'running',
          currentStep: 'Loading configuration...',
        }))

        const { agent, modelInfo } = await createAgent({
          onThought: (thought) => {
            if (!mounted) return
            setState((prev) => ({
              ...prev,
              reasoning: [...prev.reasoning, thought],
              currentStep: `Thinking: ${thought.substring(0, 50)}...`,
            }))
          },
          onToolCall: (toolName, args) => {
            if (!mounted) return
            setState((prev) => ({
              ...prev,
              currentStep: `Calling tool: ${toolName}`,
              toolCalls: [
                ...prev.toolCalls,
                {
                  toolName,
                  params: args,
                  status: 'running' as const,
                },
              ],
            }))
          },
          onToolResult: (toolName, result) => {
            if (!mounted) return
            setState((prev) => {
              const toolCalls = [...prev.toolCalls]
              // Find last index by iterating backwards
              let lastCallIndex = -1
              for (let i = toolCalls.length - 1; i >= 0; i--) {
                if (toolCalls[i].toolName === toolName) {
                  lastCallIndex = i
                  break
                }
              }
              if (lastCallIndex !== -1) {
                toolCalls[lastCallIndex] = {
                  ...toolCalls[lastCallIndex],
                  result,
                  status: 'completed' as const,
                }
              }
              return {
                ...prev,
                toolCalls,
              }
            })
          },
          onStep: (step, total) => {
            if (!mounted) return
            setState((prev) => ({
              ...prev,
              currentStep: `Step ${step} of ${total}`,
            }))
          },
        })

        if (!mounted) return

        setState((prev) => ({
          ...prev,
          currentStep: `Using ${modelInfo.provider.name} (${modelInfo.model.id})`,
          output: [`Model: ${modelInfo.provider.name}/${modelInfo.model.id}`],
        }))

        if (!mounted) return

        setState((prev) => ({
          ...prev,
          currentStep: 'Executing task...',
        }))

        const result = await agent.run(task)

        if (!mounted) return

        if (result.success) {
          setState((prev) => ({
            ...prev,
            status: 'completed',
            currentStep: 'Task completed successfully!',
            output: [
              ...prev.output,
              '',
              'Result:',
              result.result,
              '',
              `Duration: ${result.metadata.duration}ms`,
              `Turns: ${result.metadata.turnsCount}`,
            ],
          }))

          // Exit after a brief delay
          setTimeout(() => {
            if (onComplete) onComplete(result)
            exit()
          }, 2000)
        } else {
          setState((prev) => ({
            ...prev,
            status: 'error',
            currentStep: 'Task failed',
            error: result.result,
            output: [...prev.output, '', 'Error:', result.result],
          }))

          setTimeout(() => {
            exit(new Error(result.result))
          }, 2000)
        }
      } catch (error) {
        if (!mounted) return

        const message = error instanceof Error ? error.message : String(error)
        setState((prev) => ({
          ...prev,
          status: 'error',
          currentStep: 'Fatal error',
          error: message,
          output: [...prev.output, '', 'Fatal Error:', message],
        }))

        setTimeout(() => {
          exit(error instanceof Error ? error : new Error(message))
        }, 2000)
      }
    }

    runAgent()

    return () => {
      mounted = false
    }
  }, [task, onComplete, exit])

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          🤖 Cogent AI Coding Agent
        </Text>
      </Box>

      <Box marginBottom={1}>
        <Text dimColor>Task: </Text>
        <Text>{task}</Text>
      </Box>

      <Box marginBottom={1} borderStyle="round" borderColor="gray" padding={1}>
        <Box flexDirection="column" width="100%">
          <Box>
            <Text bold color="yellow">
              Status:{' '}
            </Text>
            {state.status === 'running' && (
              <>
                <Text color="green">
                  <Spinner type="dots" />
                </Text>
                <Text color="green"> Running</Text>
              </>
            )}
            {state.status === 'completed' && <Text color="green">✓ Completed</Text>}
            {state.status === 'error' && <Text color="red">✗ Error</Text>}
          </Box>

          {state.currentStep && (
            <Box marginTop={1}>
              <Text dimColor>Current: </Text>
              <Text>{state.currentStep}</Text>
            </Box>
          )}
        </Box>
      </Box>

      {state.reasoning.length > 0 && (
        <Box flexDirection="column" marginBottom={1}>
          <Text bold color="magenta">
            💭 Reasoning:
          </Text>
          {state.reasoning.slice(-3).map((thought, idx) => (
            <Box key={idx} marginLeft={2}>
              <Text dimColor>• </Text>
              <Text>{thought}</Text>
            </Box>
          ))}
        </Box>
      )}

      {state.toolCalls.length > 0 && (
        <Box flexDirection="column" marginBottom={1}>
          <Text bold color="yellow">
            🔧 Tool Calls:
          </Text>
          {state.toolCalls.slice(-5).map((toolCall, idx) => (
            <Box key={idx} flexDirection="column" marginLeft={2} marginBottom={1}>
              <Box>
                <Text color={toolCall.status === 'completed' ? 'green' : 'yellow'}>
                  {toolCall.status === 'completed' ? '✓' : '⋯'}{' '}
                </Text>
                <Text bold>{toolCall.toolName}</Text>
                <Text dimColor>({JSON.stringify(toolCall.params)})</Text>
              </Box>
              {toolCall.result && (
                <Box marginLeft={3}>
                  <Text dimColor>
                    →{' '}
                    {toolCall.result.length > 100
                      ? `${toolCall.result.substring(0, 100)}...`
                      : toolCall.result}
                  </Text>
                </Box>
              )}
            </Box>
          ))}
        </Box>
      )}

      {state.output.length > 0 && (
        <Box flexDirection="column">
          <Text bold color="cyan">
            📤 Final Output:
          </Text>
          {state.output.map((line, idx) => (
            <Box key={idx} marginLeft={2}>
              <Text>{line}</Text>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  )
}
