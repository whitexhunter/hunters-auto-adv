import { Client } from 'discord.js-selfbot-v13';

export interface SelfBotOptions {
  token: string;
  onReady?: () => void;
  onMessage?: (message: any) => void;
  onError?: (error: Error) => void;
}

export function createSelfBot(options: SelfBotOptions): Client {
  const client = new Client({ checkUpdate: false });

  client.on('ready', () => {
    console.log(`[SelfBot] Logged in as ${client.user?.tag}`);
    options.onReady?.();
  });

  client.on('messageCreate', (message: any) => { options.onMessage?.(message); });

  client.on('error', (error: Error) => {
    console.error('[SelfBot] Error:', error.message);
    options.onError?.(error);
  });

  client.login(options.token).catch((err) => {
    console.error('[SelfBot] Login failed:', err.message);
    options.onError?.(err);
  });

  return client;
}

export async function sendMessage(client: Client, channelId: string, content: string): Promise<boolean> {
  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel) throw new Error('Channel not found');
    // @ts-ignore
    await channel.send(content);
    return true;
  } catch (error: any) {
    console.error(`[SelfBot] Failed to send to ${channelId}:`, error.message);
    return false;
  }
}
