const Increment = () => {
    const [count, setCount] = useState(0);
    const handleClick = () => {
        setCount(count + 1);
    };
             const test = () => {
                console.log("test");
            }; 
  return <div>
    <button onClick={handleClick}>Increment</button>
    <p>Count: {count}</p>
  </div>;
};

export default Increment;