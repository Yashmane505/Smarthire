import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import Question from './models/Question.js';
import Test from './models/Test.js';
import User from './models/User.js';

// Load environment variables
dotenv.config();

const questionsData = [
  {
    question: "A can do a work in 15 days and B in 20 days. If they work on it together for 4 days, then the fraction of the work that is left is:",
    options: ["8/15", "7/15", "1/4", "1/10"],
    correctAnswer: "8/15",
    category: "Aptitude",
    difficulty: "Medium",
    marks: 1
  },
  {
    question: "A train running at the speed of 60 km/hr crosses a pole in 9 seconds. What is the length of the train?",
    options: ["120 metres", "180 metres", "324 metres", "150 metres"],
    correctAnswer: "150 metres",
    category: "Aptitude",
    difficulty: "Easy",
    marks: 1
  },
  {
    question: "A fruit seller had some apples. He sells 40% apples and still has 420 apples. Originally, he had:",
    options: ["588 apples", "600 apples", "672 apples", "700 apples"],
    correctAnswer: "700 apples",
    category: "Aptitude",
    difficulty: "Easy",
    marks: 1
  },
  {
    question: "If selling price of an article is 4/3 of its cost price, the profit percentage is:",
    options: ["20 1/3%", "25%", "33 1/3%", "40%"],
    correctAnswer: "33 1/3%",
    category: "Aptitude",
    difficulty: "Easy",
    marks: 1
  },
  {
    question: "A sum of money at simple interest amounts to Rs. 815 in 3 years and to Rs. 854 in 4 years. The sum is:",
    options: ["Rs. 650", "Rs. 690", "Rs. 698", "Rs. 700"],
    correctAnswer: "Rs. 698",
    category: "Aptitude",
    difficulty: "Medium",
    marks: 1
  },
  {
    question: "The compound interest on Rs. 30,000 at 7% per annum for 2 years is:",
    options: ["Rs. 4,347", "Rs. 4,200", "Rs. 4,100", "Rs. 4,400"],
    correctAnswer: "Rs. 4,347",
    category: "Aptitude",
    difficulty: "Medium",
    marks: 1
  },
  {
    question: "The average of run of a cricket player of 10 innings was 32. How many runs must he make in his next innings so as to increase his average of runs by 6?",
    options: ["70", "76", "98", "60"],
    correctAnswer: "98",
    category: "Aptitude",
    difficulty: "Medium",
    marks: 1
  },
  {
    question: "Two numbers are in the ratio 3 : 5. If 9 is subtracted from each, the new numbers are in the ratio 12 : 23. The smaller number is:",
    options: ["27", "33", "49", "55"],
    correctAnswer: "33",
    category: "Aptitude",
    difficulty: "Medium",
    marks: 1
  },
  {
    question: "A, B and C start a business with investments in the ratio 5 : 6 : 8. At the end of the year, their total profit is Rs. 57,000. What is A's share of the profit?",
    options: ["Rs. 15,000", "Rs. 18,000", "Rs. 24,000", "Rs. 20,000"],
    correctAnswer: "Rs. 15,000",
    category: "Aptitude",
    difficulty: "Easy",
    marks: 1
  },
  {
    question: "The present ages of three persons are in the proportion 4 : 7 : 9. Eight years ago, the sum of their ages was 56. Find their present ages in years.",
    options: ["8, 20, 28", "16, 28, 36", "20, 35, 45", "None of these"],
    correctAnswer: "16, 28, 36",
    category: "Aptitude",
    difficulty: "Easy",
    marks: 1
  },
  {
    question: "Three pipes A, B and C can fill a tank from empty to full in 30 minutes, 20 minutes, and 10 minutes respectively. When the tank is empty, all three pipes are opened. What fraction of the tank is filled by B in the process?",
    options: ["3/11", "2/11", "6/11", "5/11"],
    correctAnswer: "3/11",
    category: "Aptitude",
    difficulty: "Medium",
    marks: 1
  },
  {
    question: "In a lottery, there are 10 prizes and 25 blanks. A lottery is drawn at random. What is the probability of getting a prize?",
    options: ["2/7", "5/7", "1/5", "2/5"],
    correctAnswer: "2/7",
    category: "Aptitude",
    difficulty: "Easy",
    marks: 1
  },
  {
    question: "In how many ways can a committee of 5 members be formed from 7 men and 6 women consisting of 3 men and 2 women?",
    options: ["525", "1050", "450", "630"],
    correctAnswer: "525",
    category: "Aptitude",
    difficulty: "Hard",
    marks: 2
  },
  {
    question: "A man can row upstream at 8 km/hr and downstream at 12 km/hr. The speed of the man in still water is:",
    options: ["2 km/hr", "10 km/hr", "4 km/hr", "12 km/hr"],
    correctAnswer: "10 km/hr",
    category: "Aptitude",
    difficulty: "Easy",
    marks: 1
  },
  {
    question: "At what angle the hands of a clock are inclined at 15 minutes past 5?",
    options: ["52.5 degrees", "67.5 degrees", "72.5 degrees", "60 degrees"],
    correctAnswer: "67.5 degrees",
    category: "Aptitude",
    difficulty: "Medium",
    marks: 1
  },
  {
    question: "In what ratio must a grocer mix tea at Rs. 60 per kg and Rs. 65 per kg so that by selling the mixture at Rs. 68.20 per kg he may gain 10%?",
    options: ["3 : 2", "3 : 4", "3 : 5", "4 : 5"],
    correctAnswer: "3 : 2",
    category: "Aptitude",
    difficulty: "Hard",
    marks: 2
  },
  {
    question: "If 1st January 2007 was a Monday, what day of the week lies on 1st January 2008?",
    options: ["Monday", "Tuesday", "Wednesday", "Sunday"],
    correctAnswer: "Tuesday",
    category: "Aptitude",
    difficulty: "Medium",
    marks: 1
  },
  {
    question: "What is the unit digit in the product (3^65 * 6^59 * 7^71)?",
    options: ["1", "2", "4", "6"],
    correctAnswer: "4",
    category: "Aptitude",
    difficulty: "Hard",
    marks: 2
  },
  {
    question: "The H.C.F. of two numbers is 11 and their L.C.M. is 7700. If one of the numbers is 275, then the other number is:",
    options: ["279", "308", "318", "410"],
    correctAnswer: "308",
    category: "Aptitude",
    difficulty: "Medium",
    marks: 1
  },
  {
    question: "Two trains 140 m and 160 m long are running at speeds of 60 km/hr and 40 km/hr respectively in opposite directions on parallel tracks. The time (in seconds) they take to cross each other is:",
    options: ["9 sec", "10 sec", "10.8 sec", "12 sec"],
    correctAnswer: "10.8 sec",
    category: "Aptitude",
    difficulty: "Medium",
    marks: 1
  },
  {
    question: "The diagonal of a rectangle is √41 cm and its area is 20 sq.cm. The perimeter of the rectangle is:",
    options: ["9 cm", "18 cm", "20 cm", "40 cm"],
    correctAnswer: "18 cm",
    category: "Aptitude",
    difficulty: "Medium",
    marks: 1
  },
  {
    question: "Find the missing number in the series: 3, 5, 9, 17, 33, ?",
    options: ["48", "65", "60", "50"],
    correctAnswer: "65",
    category: "Aptitude",
    difficulty: "Easy",
    marks: 1
  },
  {
    question: "A, B and C can do a work in 4, 6 and 10 days respectively. Working together, they complete the work and get a total wage of Rs. 3100. What is the share of B?",
    options: ["Rs. 1000", "Rs. 1500", "Rs. 600", "Rs. 1200"],
    correctAnswer: "Rs. 1000",
    category: "Aptitude",
    difficulty: "Medium",
    marks: 1
  },
  {
    question: "A container contains 40 litres of milk. From this container, 4 litres of milk was taken out and replaced by water. This process was repeated further two times. How much milk is now contained by the container?",
    options: ["26.34 litres", "27.36 litres", "28.00 litres", "29.16 litres"],
    correctAnswer: "29.16 litres",
    category: "Aptitude",
    difficulty: "Hard",
    marks: 2
  },
  {
    question: "If 1/3 of a tank holds 80 litres of water, then the quantity of water that 1/2 of the tank holds is:",
    options: ["240 litres", "120 litres", "80 litres", "100 litres"],
    correctAnswer: "120 litres",
    category: "Aptitude",
    difficulty: "Easy",
    marks: 1
  }
];

const seedDatabase = async () => {
  try {
    // Connect to database
    await connectDB();

    // Find or create an admin user
    let admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log('No admin user found. Creating a default admin user...');
      admin = await User.create({
        name: 'Default Admin',
        email: 'admin@smarthire.com',
        password: 'adminpassword123',
        role: 'admin'
      });
      console.log('Created admin user:', admin.email);
    } else {
      console.log('Found existing admin user:', admin.email);
    }

    // Insert the 25 aptitude questions
    console.log('Inserting 25 aptitude questions...');
    const insertedQuestions = await Question.insertMany(questionsData);
    console.log(`Successfully inserted ${insertedQuestions.length} questions.`);

    const questionIds = insertedQuestions.map(q => q._id);
    const totalMarks = insertedQuestions.reduce((sum, q) => sum + q.marks, 0);

    // Create the test
    console.log('Creating Quantitative Aptitude Mock Test...');
    const newTest = await Test.create({
      title: 'Quantitative Aptitude Comprehensive Mock Test',
      questions: questionIds,
      duration: 35, // 35 minutes
      totalMarks: totalMarks,
      createdBy: admin._id
    });

    console.log(`Successfully created test: "${newTest.title}"`);
    console.log(`Duration: ${newTest.duration} minutes`);
    console.log(`Total Questions: ${newTest.questions.length}`);
    console.log(`Total Marks: ${newTest.totalMarks}`);

    // Disconnect
    await mongoose.disconnect();
    console.log('Database disconnected.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();
