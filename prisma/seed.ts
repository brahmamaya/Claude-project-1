import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  await db.test.deleteMany({ where: { title: "Sample JEE Main Mock 1" } });
  await db.test.create({
    data: {
      title: "Sample JEE Main Mock 1",
      exam: "JEE_MAIN",
      durationMin: 30,
      published: true,
      questions: {
        create: [
          { order: 1, subject: "PHYSICS", type: "MCQ", text: "SI unit of force is:", options: JSON.stringify(["Joule", "Newton", "Watt", "Pascal"]), correctAnswer: "1", explanation: "F = ma, so kg·m/s² = Newton." },
          { order: 2, subject: "PHYSICS", type: "NUMERICAL", text: "A body of mass 2 kg accelerates at 5 m/s². Find the force in N.", options: "[]", correctAnswer: "10", negative: 0, explanation: "F = ma = 2 × 5 = 10 N." },
          { order: 3, subject: "CHEMISTRY", type: "MCQ", text: "Atomic number of Carbon is:", options: JSON.stringify(["4", "6", "8", "12"]), correctAnswer: "1", explanation: "Carbon has 6 protons." },
          { order: 4, subject: "MATHS", type: "MCQ", text: "d/dx (x²) = ?", options: JSON.stringify(["x", "2x", "x²", "2"]), correctAnswer: "1", explanation: "Power rule." },
          { order: 5, subject: "MATHS", type: "NUMERICAL", text: "Sum of roots of x² − 7x + 12 = 0 is:", options: "[]", correctAnswer: "7", negative: 0, explanation: "Sum = −b/a = 7." },
        ],
      },
    },
  });
  console.log("Seeded sample test.");
}

main().finally(() => db.$disconnect());
