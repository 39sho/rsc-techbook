const Sleep = async () => {
	await new Promise((resolve, _reject) => setTimeout(resolve, 10000));
	return <div>good morning!</div>;
};

export { Sleep };
