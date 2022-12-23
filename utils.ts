export function convertPlate(plate: string) {
  if (plate === "unknown") return plate;
  const dict = {
    A: "A",
    B: "B",
    C: "C",
    D: "B",
    E: "E",
    F: "E",
    G: "B",
    H: "H",
    I: "I",
    J: "I",
    K: "B",
    L: "I",
    M: "M",
    N: "M",
    O: "B",
    P: "B",
    Q: "B",
    R: "B",
    S: "E",
    T: "I",
    U: "E",
    V: "E",
    W: "M",
    X: "E",
    Y: "E",
    Z: "I",
    "0": "B",
    "1": "I",
    "2": "I",
    "3": "B",
    "4": "B",
    "5": "E",
    "6": "B",
    "7": "I",
    "8": "B",
    "9": "9",
  };
  let output = "";
  for (let i = 0; i < plate.length; i++) {
    if (String(dict[plate[i] as keyof typeof dict]) !== "undefined") {
      output += String(dict[plate[i] as keyof typeof dict]);
    }
  }
  return output;
}
