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

export const options = {
  responsive: true,
  plugins: {
    legend: {
      position: "top" as const,
      onHover: function (event, legendItem) {
        if (hovering) {
          return;
        }
        hovering = true;
        let tooltip = document.getElementById("tooltip");
        tooltip.innerHTML = tooltips[legendItem.datasetIndex];
        tooltip.style.left = event.x + "px";
        tooltip.style.top = event.y + "px";
      },
      onLeave: function () {
        let tooltip = document.getElementById("tooltip");
        hovering = false;
        tooltip.innerHTML = "";
      },
    },
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
        // backgroundColor: "rgba(255, 99, 132, 0.5)",
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

  return (
    <div className="maindiv">
      <h1>Let's find you some teammates!</h1>
      <h3> 1. Select your Alias:</h3>
      <select
        onChange={(e) => calculateAndSetChartData(e.target.value as number)}
      >
        {allData.map((row, i) => (
          <option value={i}>{row["ALIAS"]}</option>
        ))}
      </select>
      <h3> 2. These three complement your skills the best:</h3>
      <Line options={options} data={chartData} />
      <div id="tooltip" className="tooltip"></div>
    </div>
  );
}
