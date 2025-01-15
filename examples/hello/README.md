# Realtime API Examples

This directory contains examples demonstrating how to use the Realtime API client.

## Example

### Hello World (`hello.ts`)

Shows the basic usage of the Realtime API client:

- Initializing the client
- Connecting to the server
- Sending a text message
- Receiving and playing audio responses

## Running the Example

1. Install dependencies:

```bash
# In the examples directory
cd examples
pnpm install
```

2. Replace `'your-api-key'` in the example with your actual API key.

3. Run the example:

```bash
pnpm tsx hello.ts
```

## Notes

- Make sure to keep your API key secure and never commit it to version control.
- Audio playback requires the speaker package and a working audio output device.
- On Linux, you may need to install additional audio dependencies: `sudo apt-get install libasound2-dev`
