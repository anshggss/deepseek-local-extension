import ollama from "ollama";
import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "deepseeklocal" is now active!');

  const disposable = vscode.commands.registerCommand(
    "deepseeklocal.AskDeepSeek",
    () => {
      const panel = vscode.window.createWebviewPanel(
        "deepseeklocal",
        "Deepseek Local",
        vscode.ViewColumn.One,
        {
          enableScripts: true,
        }
      );

      panel.webview.html = getWebviewContent();

      panel.webview.onDidReceiveMessage(async (message: any) => {
        if (message.command === "chat") {
          const userPrompt = message.prompt;
          let response = "";

          try {
            const streamResponse = await ollama.chat({
              model: "deepseek-r1:8b",
              messages: [{ role: "user", content: userPrompt }],
              stream: true,
            });

            for await (const part of streamResponse) {
              response += part.message.content;
              panel.webview.postMessage({
                command: "chatResponse",
                text: response,
              });
            }
          } catch (err) {
            console.error("Error in ollama.chat:", err);
            panel.webview.postMessage({
              command: "chatResponse",
              text: `Error: Unable to process your request. Please try again later.`,
            });
          }
        }
      });

      panel.onDidDispose(() => {
        // Clean up resources if needed
      });
    }
  );

  context.subscriptions.push(disposable);
}

function getWebviewContent(): string {
  return /*html*/ `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="author" content="Ansh Mani Tripathi">
      <title>DeepSeekLocal</title>
      <style>
          body {
              font-family: Arial, sans-serif;
              padding: 20px;
          }
          textarea {
              width: 90%;
              padding: 10px;
              margin-bottom: 10px;
              border-radius:10px;
          }
          button {
              padding: 10px 20px;
              background-color: #007acc;
              color: white;
              border: none;
              cursor: pointer;
          }
          button:hover {
              background-color: #005f99;
          }
          #response {
              margin-top: 20px;
              white-space: pre-wrap;
          }
      </style>
  </head>
  <body>
      <h2>Ask DeepSeek</h2><br/>
      <textarea id="prompt" rows="3" placeholder="Ask something..."></textarea><br/>
      <button id="askBtn">Ask</button>
      <div id="response"></div>
  </body>
  <script>
      const vscode = acquireVsCodeApi();
      document.getElementById('askBtn').addEventListener('click', () => {
          const prompt = document.getElementById('prompt').value;
          vscode.postMessage({ command: 'chat', prompt });
      });

      window.addEventListener('message', event => {
          const { command, text } = event.data;
          if (command === 'chatResponse') {
              document.getElementById('response').innerText = text;
          }
      });
  </script>
  </html>
  `;
}

export function deactivate() {}
