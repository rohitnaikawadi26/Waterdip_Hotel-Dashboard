import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import ApexCharts from 'react-apexcharts';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './App.css';


const App = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [startDate, setStartDate] = useState(new Date('2015-07-01'));
  const [endDate, setEndDate] = useState(new Date('2015-08-10'));

  // Function to fetch and parse CSV data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/hotel_bookings_1000.csv');
        const reader = response.body.getReader();
        const result = await reader.read();
        const decoder = new TextDecoder('utf-8');
        const csv = decoder.decode(result.value);

        // Parse the CSV file
        const results = Papa.parse(csv, { header: true });

        // Ensure there's valid data
        if (results.data && results.data.length > 0) {
          setData(results.data);
          filterDataByDate(results.data, startDate, endDate); // Filter data by default date range
          setIsLoading(false); // Data is loaded
        } else {
          setHasError(true); // If data is invalid or empty
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setHasError(true); // Set error state if fetching fails
      }
    };
    fetchData();
  }, [startDate, endDate]);

  // Filter data based on selected date range
  const filterDataByDate = (allData, start, end) => {
    const filtered = allData.filter(booking => {
      const bookingDate = new Date(
        `${booking.arrival_date_year}-${booking.arrival_date_month}-${booking.arrival_date_day_of_month}`
      );
      return bookingDate >= start && bookingDate <= end;
    });
    setFilteredData(filtered);
  };

  // Handle date change
  const handleDateChange = () => {
    filterDataByDate(data, startDate, endDate);
  };

  // Aggregate data by date (Time Series Chart for Visitors per Day)
  const getTimeSeriesData = () => {
    const aggregatedData = filteredData.reduce((acc, booking) => {
      const dateKey = `${booking.arrival_date_year}-${booking.arrival_date_month}-${booking.arrival_date_day_of_month}`;
      const visitors = Number(booking.adults) + Number(booking.children) + Number(booking.babies);

      if (acc[dateKey]) {
        acc[dateKey] += visitors;  // Sum visitors if date already exists
      } else {
        acc[dateKey] = visitors;
      }
      return acc;
    }, {});

    return Object.entries(aggregatedData).map(([date, visitors]) => ({
      x: date,
      y: visitors,
    }));
  };

  // Aggregate data by country (Column Chart for Visitors per Country)
  const getCountryData = () => {
    const countryData = filteredData.reduce((acc, booking) => {
      const visitors = Number(booking.adults) + Number(booking.children) + Number(booking.babies);

      if (acc[booking.country]) {
        acc[booking.country] += visitors;  // Sum visitors if country already exists
      } else {
        acc[booking.country] = visitors;
      }
      return acc;
    }, {});

    return Object.entries(countryData).map(([country, visitors]) => ({
      x: country,
      y: visitors,
    }));
  };

  // Generate time series data for Adults
  const getAdultsTimeSeriesData = () => {
    const aggregatedData = filteredData.reduce((acc, booking) => {
      const dateKey = `${booking.arrival_date_year}-${booking.arrival_date_month}-${booking.arrival_date_day_of_month}`;
      const adults = Number(booking.adults);

      if (acc[dateKey]) {
        acc[dateKey] += adults;  // Sum adults if date already exists
      } else {
        acc[dateKey] = adults;
      }
      return acc;
    }, {});

    return Object.entries(aggregatedData).map(([date, adults]) => ({
      x: date,
      y: adults,
    }));
  };

  // Generate time series data for Children
  const getChildrenTimeSeriesData = () => {
    const aggregatedData = filteredData.reduce((acc, booking) => {
      const dateKey = `${booking.arrival_date_year}-${booking.arrival_date_month}-${booking.arrival_date_day_of_month}`;
      const children = Number(booking.children);

      if (acc[dateKey]) {
        acc[dateKey] += children;  // Sum children if date already exists
      } else {
        acc[dateKey] = children;
      }
      return acc;
    }, {});

    return Object.entries(aggregatedData).map(([date, children]) => ({
      x: date,
      y: children,
    }));
  };

  if (isLoading) {
    return <div>Loading data...</div>;
  }

  if (hasError) {
    return <div>Error loading data. Please check the CSV file and try again.</div>;
  }

  return (
    <div>
      <h1>Hotel Booking Dashboard</h1>

      {/* Date Range Selector */}
      <div className="date-range-container">
        <h3>Select Date Range</h3>
        <DatePicker
          selected={startDate}
          onChange={date => setStartDate(date)}
          selectsStart
          startDate={startDate}
          endDate={endDate}
          dateFormat="yyyy-MM-dd"
        />
        <DatePicker
          selected={endDate}
          onChange={date => setEndDate(date)}
          selectsEnd
          startDate={startDate}
          endDate={endDate}
          minDate={startDate}
          dateFormat="yyyy-MM-dd"
        />
        <button onClick={handleDateChange}>Apply Date Filter</button>
      </div>

      {/* Time Series Chart: Visitors per Day */}
      <div id="chart">
        <h3>Number of Visitors per Day</h3>
        <ApexCharts
          type="line"
          series={[{ name: 'Visitors', data: getTimeSeriesData() }]}
          options={{
            chart: { id: 'time-series-chart' },
            xaxis: { type: 'datetime' },
          }}
        />
      </div>

      {/* Column Chart: Visitors per Country */}
      <div id="chart">
        <h3>Number of Visitors per Country</h3>
        <ApexCharts
          type="bar"
          series={[{ name: 'Visitors', data: getCountryData() }]}
          options={{
            chart: { id: 'country-chart' },
            xaxis: { categories: getCountryData().map(item => item.x) },
          }}
        />
      </div>

      {/* Time Series Chart: Total Adult Visitors */}
      <div id="chart">
        <h3>Total Adult Visitors</h3>
        <ApexCharts
          type="line"
          series={[{ name: 'Adults', data: getAdultsTimeSeriesData() }]}
          options={{
            chart: { id: 'adults-chart' },
            xaxis: { type: 'datetime' },
          }}
        />
      </div>

      {/* Time Series Chart: Total Children Visitors */}
      <div id="chart">
        <h3>Total Children Visitors</h3>
        <ApexCharts
          type="line"
          series={[{ name: 'Children', data: getChildrenTimeSeriesData() }]}
          options={{
            chart: { id: 'children-chart' },
            xaxis: { type: 'datetime' },
          }}
        />
      </div>
    </div>
  );
};

export default App;
