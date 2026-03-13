import {
  AutoTokenizer,
  AutoModelForCausalLM,
  TextStreamer,
} from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3/dist/transformers.min.js";

const MODEL_ID = "onnx-community/Qwen3-0.6B-ONNX";

let tokenizer = null;
let model = null;

async function load() {
  if (model) return;

  self.postMessage({ type: "status", message: "Loading tokenizer..." });

  tokenizer = await AutoTokenizer.from_pretrained(MODEL_ID);

  self.postMessage({ type: "status", message: "Loading model..." });

  model = await AutoModelForCausalLM.from_pretrained(MODEL_ID, {
    dtype: "q4f16",
    device: "webgpu",
    progress_callback: (progress) => {
      if (progress.status === "progress") {
        self.postMessage({
          type: "progress",
          file: progress.file,
          loaded: progress.loaded,
          total: progress.total,
          progress: progress.progress,
        });
      }
    },
  });

  self.postMessage({ type: "status", message: "Ready" });
  self.postMessage({ type: "ready" });
}

async function generate(messages) {
  if (!model || !tokenizer) {
    await load();
  }

  const text = tokenizer.apply_chat_template(messages, {
    tokenize: false,
    add_generation_prompt: true,
    enable_thinking: false,
  });

  const inputs = tokenizer(text);

  self.postMessage({ type: "gen_start" });

  let fullText = "";

  const streamer = new TextStreamer(tokenizer, {
    skip_prompt: true,
    skip_special_tokens: true,
    callback_function: (token) => {
      fullText += token;
      self.postMessage({ type: "gen_token", token });
    },
  });

  await model.generate({
    ...inputs,
    max_new_tokens: 512,
    do_sample: true,
    temperature: 0.7,
    top_p: 0.9,
    streamer,
  });

  self.postMessage({ type: "gen_done", text: fullText });
}

self.onmessage = async (e) => {
  const { type } = e.data;

  if (type === "load") {
    try {
      await load();
    } catch (err) {
      self.postMessage({ type: "error", error: err.message });
    }
  } else if (type === "generate") {
    try {
      await generate(e.data.messages);
    } catch (err) {
      self.postMessage({ type: "error", error: err.message });
    }
  }
};
