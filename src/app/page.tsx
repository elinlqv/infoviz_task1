//import LineChart from './linechart';

"use client";
import "./globals.css";
const categories = [
  "viz",
  "stats",
  "math",
  "art",
  "ui",
  "code",
  "graph",
  "hci",
  "eval",
  "comm",
  "collab",
  "GIT",
];

import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  Point,
} from "chart.js";
import { Line } from "react-chartjs-2";
import * as d3 from "d3";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);
let hovering = false,
  tooltips = ["such tooltip", "blah blah"];

const options = {
  responsive: true,
  plugins: {
    legend: {
      position: "top" as const,
    },

    // legend: {
    //   position: "top" as const,
    //   onHover: function (event, legendItem) {
    //     if (hovering) {
    //       return;
    //     }
    //     hovering = true;
    //     let tooltip = document.getElementById("tooltip");
    //     tooltip.innerHTML = tooltips[legendItem.datasetIndex];
    //     tooltip.style.left = event.x + "px";
    //     tooltip.style.top = event.y + "px";
    //   },
    //   onLeave: function () {
    //     let tooltip = document.getElementById("tooltip");
    //     hovering = false;
    //     tooltip.innerHTML = "";
    //   },
    // },
  },
};

export default function App() {
  const [allData, setAllData] = useState<Record<string, any>[]>();
  const [chartData, setChartData] =
    useState<ChartData<"line", (number | Point | null)[], unknown>>();
  const [datasets, setDatasets] = useState<any[]>();

  useEffect(() => {
    async function getData() {
      const all_data_rows = await d3.csv("/input.csv");
      setAllData(all_data_rows);

      const datasets = all_data_rows.map((rowObject) => ({
        label: rowObject["ALIAS"],
        data: Object.keys(rowObject)
          .filter((key) => categories.includes(key))
          .map((key) => rowObject[key]), // skapar en lista med nyckelpar
        borderColor: "rgb(255, 99, 255)",
        // options:{
        //   legend:{onHover((rowObject)=> rowObject[]) }
        // };
        //backgroundColor: "rgba(255, 99, 132, 0.5)",
      }));

      setDatasets(datasets);
      setChartData({
        labels: categories,
        datasets: [],
      });
    }
    getData();
  }, []);

  function calculateAndSetChartData(yourRowIndex: number) {
    // TODO, calculate youself and three other datasets

    const numeric_dataset = allData
      ?.filter((_, index) => index != yourRowIndex)
      .map((rowObject) =>
        Object.keys(rowObject)
          .filter((key) => categories.includes(key))
          .map((key) => Number(rowObject[key]))
      );
    if (!allData || !numeric_dataset || !datasets) return;
    //todo filter yourself
    console.log(numeric_dataset);

    //gör om "migsjälv till samma format som numeric dataset
    const me_numeric = Object.keys(allData[yourRowIndex])
      .filter((key) => categories.includes(key))
      .map((key) => Number(allData[yourRowIndex][key]));

    console.log(me_numeric);
    //för varje person i numeric dataset
    //räkna ut differensen mellan värde och värdet jag själv har på samma plats.
    //addera differenserna
    //spara differensen med personens index i en array
    const index_and_difference = [];
    for (let i = 0; i < numeric_dataset.length; i++) {
      let accumulated_difference = 0;

      for (let j = 0; j < me_numeric.length; j++) {
        accumulated_difference += Math.min(
          me_numeric[j] - numeric_dataset[i][j],
          0
        );
      }
      index_and_difference.push({
        index: i,
        accumulated_difference: accumulated_difference,
      });
    }

    //sortera arrayen: högst differens först
    console.log(index_and_difference);
    index_and_difference.sort(
      (a, b) => a.accumulated_difference - b.accumulated_difference
    );
    console.log(index_and_difference);

    //plocka ut indesen av de tre första i den sorterade arrayen

    //rendera deras linjer.
    const datasetsWithoutMe = datasets.filter(
      (_, index) => index != yourRowIndex
    );

    const otherDataset = {
      ...datasetsWithoutMe[index_and_difference[0].index],
      borderColor: "rgb(255, 0, 0)",
    };
    const otherDataset2 = {
      ...datasetsWithoutMe[index_and_difference[1].index],
      borderColor: "rgb(0, 255, 0)",
    };
    const otherDataset3 = {
      ...datasetsWithoutMe[index_and_difference[2].index],
      borderColor: "rgb(0, 0, 255)",
    };
    setChartData((current) => ({
      ...current,
      datasets: [
        datasets[yourRowIndex],
        otherDataset,
        otherDataset2,
        otherDataset3,
      ],
    }));
  }

  if (!chartData || !allData) return "loading...";
  console.log(allData);
  return (
    <div className="maindiv">
      <div className="paragraphdiv">
        <h1>Let&apos;s find you some teammates!</h1>
        <p>
          This interactive chart visualizes students who&apos;s skills
          complements eachother well.
        </p>
        <p>
          The groups are suggested based on an algorithm that calculates the
          differrences in knowleglevel between you and all of your classmates
          for all skills where they are better than you.{" "}
        </p>
        <p>
          The three people with the biggest summed difference in skillleves will
          complement you the best. Those will be displayed in the chart
        </p>
        <p>Scroll down to see their hobbies!</p>
      </div>
      <h3> 1. Select your Alias:</h3>
      <select
        onChange={(e) => calculateAndSetChartData(Number(e.target.value))}
      >
        {allData.map((row, i) => (
          <option key={i} value={i}>
            {row["ALIAS"]}
          </option>
        ))}
      </select>
      <h3>
        {" "}
        2. According to my algorithm, this group would complement your skills
        the best:
      </h3>
      <Line options={options} data={chartData} className="chart" />
      <h3 className="learnmore">3. Learn more about your group:</h3>
      <div className="infoContainer">
        {chartData && chartData.datasets.length > 0 && allData && (
          <React.Fragment>
            <div className="purpleContainer">
              <h3>{chartData.datasets[0].label}&apos;s Hobbies:</h3>
              <p>
                {
                  allData.find(
                    (row) => row["ALIAS"] === chartData.datasets[0].label
                  )?.["Hobbies"]
                }
              </p>
            </div>
            <div className="redContainer">
              <h3>{chartData.datasets[1].label}&apos;s Hobbies:</h3>
              <p>
                {
                  allData.find(
                    (row) => row["ALIAS"] === chartData.datasets[1].label
                  )?.["Hobbies"]
                }
              </p>
            </div>
            <div className="greenContainer">
              <h3>{chartData.datasets[2].label}&apos;s Hobbies:</h3>
              <p>
                {
                  allData.find(
                    (row) => row["ALIAS"] === chartData.datasets[2].label
                  )?.["Hobbies"]
                }
              </p>
            </div>
            <div className="blueContainer">
              <h3>{chartData.datasets[3].label}&apos;s Hobbies:</h3>
              <p>
                {
                  allData.find(
                    (row) => row["ALIAS"] === chartData.datasets[3].label
                  )?.["Hobbies"]
                }
              </p>
            </div>
          </React.Fragment>
        )}
      </div>
    </div>
  );
}
