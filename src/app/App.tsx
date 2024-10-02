import { Action } from "./Action";
import { ActionFn, FormActionFn } from "./ActionFn";
import { Counter } from "./Counter";

const App = () => {
	return (
		<div>
			<div>Hello!</div>
			<Counter />
			<Action action={ActionFn} />
			<form action={FormActionFn}>
				<button type="submit">action [form]</button>
			</form>
		</div>
	);
};

export { App };
