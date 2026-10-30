// Plain-language explanations of the errors beginners meet most, shown under the raw message.
const HELP = {
  SyntaxError: 'Python could not read this line. Look for a missing colon, bracket or quote, on this line or the one before it.',
  IndentationError: 'The indentation is wrong. Blocks under def, if, for, while and class are indented by 4 spaces, consistently.',
  TabError: 'Tabs and spaces are mixed in the indentation. Use spaces only.',
  NameError: 'A name is used before it was defined. Check the spelling and capitalisation, and that it was assigned (or imported) earlier.',
  TypeError: 'An operation got the wrong type of value: adding a str to an int, calling something that is not a function, or passing the wrong number of arguments.',
  ValueError: 'The type was right but the value was not, such as int("abc").',
  KeyError: 'A dict was indexed with a key it does not have. Use .get(key, default) when a key may be missing.',
  IndexError: 'A list index is past the end of the list. An empty list has no items[0] or items[-1].',
  AttributeError: 'The object has no attribute or method with that name. Check the spelling, and what type the value actually is.',
  ZeroDivisionError: 'Division by zero. Check for zero before dividing.',
  ImportError: 'The import failed. Check the name of the module and of the thing imported from it.',
  ModuleNotFoundError: 'No module has that name. The standard library, mockllm, pydantic and numpy are available.',
  RecursionError: 'A function called itself too many times. A recursive function needs a case where it stops.',
  UnboundLocalError: 'A variable is used inside a function before it is assigned there. Assigning anywhere in a function makes the name local to it.',
  JSONDecodeError: 'The text is not valid JSON. JSON needs double quotes, and true/false/null rather than True/False/None.',
  APIError: 'MockLLM rejected the request. The message explains what was wrong with the conversation.',
  RateLimitError: 'A scripted rate-limit failure from MockLLM. Code is expected to retry.',
  RuntimeError: 'A general error raised by Python or a library. Read the message.',
};

export function explainError(type) {
  return HELP[type] || null;
}
