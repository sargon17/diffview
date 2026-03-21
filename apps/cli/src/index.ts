#!/usr/bin/env node
import chalk from 'chalk';
import { Command } from 'commander';

const program = new Command();

async function waitForServer(url: string, timeoutMs = 15000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await Bun.sleep(200);
  }

  throw new Error(`Timed out waiting for ${url}`);
}

program
  .name('deffview')
  .description('A better way to visualize diffs')
  .version('0.0.1')
  .action(async () => {
    // TODO API
    // console.log(chalk.bgMagenta("starting api layer"))
    // const api = Bun.spawn(["bun", "run", "--cwd", "../api", "dev"], {
    //   stdio: ["ignore", "ignore", "ignore"]
    // })

    console.log(chalk.bgMagenta("starting web layer"))
    const web = Bun.spawn(["bun", "run", "--cwd", "../web", "dev"], {
      stdio: ["ignore", "ignore", "ignore"]
    })

    console.log(chalk.bgMagenta("opening web view at http://localhost:5173"))
    await waitForServer("http://localhost:5173");
    Bun.spawn(["open", "http://localhost:5173"],  {
      stdio: ["ignore", "ignore", "ignore"]
    })

  })



program.parse();
