const { GoogleGenerativeAI } = require("@google/generative-ai");

async function run() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.TEST_API_KEY);
    // There isn't a direct listModels in the simple SDK without REST, but we can try generating content with gemini-1.5-flash
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Hello");
    console.log("gemini-1.5-flash OK:", result.response.text());
  } catch (e) {
    console.error("Error gemini-1.5-flash:", e.message);
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.TEST_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
    const result = await model.generateContent("Hello");
    console.log("gemini-3.6-flash OK:", result.response.text());
  } catch (e) {
    console.error("Error gemini-3.6-flash:", e.message);
  }
}

run();
