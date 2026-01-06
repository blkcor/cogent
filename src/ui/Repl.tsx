import { useState, useEffect } from 'react'
import { Box, Text, useInput, useApp } from 'ink'
import Spinner from 'ink-spinner'
import { createAgent } from '../index.js'
import { PRODUCT_NAME, VERSION } from '../constants.js'

export function Repl() {
  const { exit } = useApp()
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentResponse, setCurrentResponse] = useState<string>('')
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    setHistory([
      `🤖 ${PRODUCT_NAME} v${VERSION}`,
      '',
      'Welcome to Cogent interactive mode!',
      'Type your coding tasks and press Enter to execute.',
      'Type "exit" or press Ctrl+C to quit.',
      'Type "clear" to clear the screen.',
      '',
    ])
    setInitialized(true)
  }, [])

  useInput((char, key) => {
    if (isProcessing) return

    if (key.ctrl && char === 'c') {
      exit()
      return
    }

    if (key.return) {
      setInput((currentInput) => {
        if (!currentInput.trim()) return currentInput

        const command = currentInput.trim()

        if (command.toLowerCase() === 'exit' || command.toLowerCase() === 'quit') {
          exit()
          return currentInput
        }

        if (command.toLowerCase() === 'clear') {
          setHistory([])
          return ''
        }

        // Add user input to history
        setHistory((prev) => [...prev, `> ${command}`, ''])
        setIsProcessing(true)
        setCurrentResponse('')

        // Execute the task
        executeTask(command)
        
        return ''
      })
      return
    }

    if (key.backspace || key.delete) {
      setInput((prev) => prev.slice(0, -1))
      return
    }

    if (char.length === 1 && !key.ctrl && !key.meta) {
      setInput((prev) => prev + char)
    }
  })

  async function executeTask(task: string) {
    try {
      setCurrentResponse('Initializing agent...')
      const { agent, modelInfo } = await createAgent()

      setCurrentResponse(`Using ${modelInfo.provider.name}/${modelInfo.model.id}...`)

      const result = await agent.run(task)

      if (result.success) {
        setHistory((prev) => [
          ...prev,
          `✅ Completed in ${result.metadata.duration}ms (${result.metadata.turnsCount} turns)`,
          '',
          result.result,
          '',
        ])
      } else {
        setHistory((prev) => [...prev, `❌ Failed: ${result.result}`, ''])
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setHistory((prev) => [...prev, `❌ Error: ${message}`, ''])
    } finally {
      setIsProcessing(false)
      setCurrentResponse('')
    }
  }

  if (!initialized) {
    return (
      <Box padding={1}>
        <Text>
          <Spinner type="dots" /> Initializing...
        </Text>
      </Box>
    )
  }

  return (
    <Box flexDirection="column" padding={1}>
      {/* History */}
      {history.map((line, idx) => (
        <Box key={idx}>
          <Text color={line.startsWith('>') ? 'cyan' : line.startsWith('✅') ? 'green' : line.startsWith('❌') ? 'red' : undefined}>
            {line}
          </Text>
        </Box>
      ))}

      {/* Current response while processing */}
      {isProcessing && currentResponse && (
        <Box>
          <Text color="yellow">
            <Spinner type="dots" /> {currentResponse}
          </Text>
        </Box>
      )}

      {/* Input prompt */}
      {!isProcessing && (
        <Box>
          <Text bold color="green">
            cogent{' '}
          </Text>
          <Text color="gray">
            ❯{' '}
          </Text>
          <Text>{input}</Text>
          <Text inverse> </Text>
        </Box>
      )}
    </Box>
  )
}

